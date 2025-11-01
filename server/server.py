#!/usr/bin/env python3
"""
flowProbe SSE Server - High-Load Retail Order/Payment Stream Simulation
Simulates a large retailer's order and payment flow compressed into 2-3 minutes
"""

import json
import random
import time
import uuid
import asyncio
from datetime import datetime, timezone
from typing import Dict, List, Any, Optional
from dataclasses import dataclass, asdict
from enum import Enum
from aiohttp import web
from aiohttp.web import Response, StreamResponse
import logging

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# Load configuration from JSON files
ORDER_CONFIG = {
    "mobile": ["apple", "android"],
    "retail": ["windows", "raspberry-pi"],
    "desktop": ["safari", "chrome"]
}

PAYMENT_CONFIG = {
    "cards": ["visa", "mastercard"],
    "provider": ["paypal", "stripe", "amazon-pay"],
    "platform": ["apple-pay", "google-pay"]
}

class MessageType(Enum):
    START = "start"
    END = "end"
    SPAWN = "spawn"
    INFO = "info"
    SCALE_UP = "scale-up"
    SCALE_DOWN = "scale-down"

@dataclass
class Order:
    uuid: str
    type: str
    name: str
    value: int

@dataclass
class Payment:
    uuid: str
    type: str
    name: str
    value: int

class TrafficPattern:
    """Represents different traffic patterns throughout the simulation"""
    def __init__(self, name: str, spawn_rate: float, duration: int, info_message: str):
        self.name = name
        self.spawn_rate = spawn_rate  # messages per second
        self.duration = duration  # seconds
        self.info_message = info_message

class FlowProbeSimulator:
    def __init__(self):
        self.order_nodes = 2
        self.payment_nodes = 2
        self.max_nodes = 12
        self.min_nodes = 1
        self.connection_uuid = str(uuid.uuid4())
        self.start_time = None
        self.traffic_patterns = self._init_traffic_patterns()

    def _init_traffic_patterns(self) -> List[TrafficPattern]:
        """Initialize realistic traffic patterns for a 2-3 minute simulation"""
        return [
            TrafficPattern("morning_surge", 5, 15, "Morning rush beginning, coffee and breakfast orders surging"),
            TrafficPattern("steady_morning", 8, 10, "Steady morning traffic, office supplies and electronics picking up"),
            TrafficPattern("pre_lunch_spike", 12, 8, "Pre-lunch spike, food delivery orders increasing rapidly"),
            TrafficPattern("lunch_rush", 20, 12, "Lunch rush hour, maximum load on all systems"),
            TrafficPattern("post_lunch", 15, 10, "Post-lunch activity, mix of retail and online orders"),
            TrafficPattern("afternoon_surge", 18, 15, "Afternoon surge, home delivery slots filling up"),
            TrafficPattern("happy_hour", 25, 8, "Happy hour flash sales driving massive traffic"),
            TrafficPattern("evening_peak", 30, 10, "Evening peak, entertainment and dining orders skyrocketing"),
            TrafficPattern("prime_time", 35, 12, "Prime time shopping, all categories experiencing high volume"),
            TrafficPattern("late_evening", 22, 10, "Late evening deals, last-minute orders before cutoff"),
            TrafficPattern("night_steady", 15, 8, "Night shift steady flow, international orders coming in"),
            TrafficPattern("midnight_deals", 28, 10, "Midnight flash deals creating temporary surge"),
            TrafficPattern("wind_down", 10, 15, "Winding down, preparing for next day cycle"),
            TrafficPattern("closing", 5, 10, "Final orders of the simulation period")
        ]

    def _generate_order(self) -> Order:
        """Generate a random order"""
        order_type = random.choice(list(ORDER_CONFIG.keys()))
        order_name = random.choice(ORDER_CONFIG[order_type])
        return Order(
            uuid=str(uuid.uuid4()),
            type=order_type,
            name=order_name,
            value=random.randint(1, 50)
        )

    def _generate_payment(self) -> Payment:
        """Generate a random payment"""
        payment_type = random.choice(list(PAYMENT_CONFIG.keys()))
        payment_name = random.choice(PAYMENT_CONFIG[payment_type])
        return Payment(
            uuid=str(uuid.uuid4()),
            type=payment_type,
            name=payment_name,
            value=random.randint(1, 50)
        )

    def _create_message(self, msg_type: MessageType, **kwargs) -> Dict[str, Any]:
        """Create a message based on type"""
        if msg_type == MessageType.START:
            return {
                "type": msg_type.value,
                "uuid": self.connection_uuid,
                "timestamp": datetime.now(timezone.utc).isoformat().replace('+00:00', 'Z')
            }
        elif msg_type == MessageType.END:
            return {
                "type": msg_type.value,
                "uuid": self.connection_uuid,
                "timestamp": datetime.now(timezone.utc).isoformat().replace('+00:00', 'Z')
            }
        elif msg_type == MessageType.SPAWN:
            order = self._generate_order()
            payment = self._generate_payment()
            return {
                "type": msg_type.value,
                "uuid": str(uuid.uuid4()),
                "order": asdict(order),
                "payment": asdict(payment)
            }
        elif msg_type == MessageType.INFO:
            return {
                "type": msg_type.value,
                "message": kwargs.get("message", "System operating normally")
            }
        elif msg_type in [MessageType.SCALE_UP, MessageType.SCALE_DOWN]:
            return {
                "type": msg_type.value,
                "entity": kwargs.get("entity", "order"),
                "factor": kwargs.get("factor", 1)
            }
        return {}

    def _should_scale(self, current_rate: float, entity: str) -> Optional[Dict[str, Any]]:
        """Determine if scaling is needed based on current traffic rate"""
        current_nodes = self.order_nodes if entity == "order" else self.payment_nodes

        # Scale up if rate is high and we have capacity
        if current_rate > 15 and current_nodes < self.max_nodes:
            if random.random() < 0.3:  # 30% chance to scale when needed
                factor = min(random.randint(1, 3), self.max_nodes - current_nodes)
                if entity == "order":
                    self.order_nodes += factor
                else:
                    self.payment_nodes += factor
                return self._create_message(MessageType.SCALE_UP, entity=entity, factor=factor)

        # Scale down if rate is low and we have excess capacity
        elif current_rate < 10 and current_nodes > self.min_nodes:
            if random.random() < 0.2:  # 20% chance to scale down
                factor = min(random.randint(1, 2), current_nodes - self.min_nodes)
                if entity == "order":
                    self.order_nodes -= factor
                else:
                    self.payment_nodes -= factor
                return self._create_message(MessageType.SCALE_DOWN, entity=entity, factor=factor)

        return None

    async def generate_stream(self, response: StreamResponse):
        """Generate the SSE stream"""
        self.start_time = time.time()

        # Send start message
        start_msg = self._create_message(MessageType.START)
        await self._send_sse_message(response, start_msg)
        logger.info(f"Stream started with connection UUID: {self.connection_uuid}")

        total_spawn_count = 0
        total_info_count = 0
        total_scale_count = 0

        try:
            for pattern in self.traffic_patterns:
                pattern_start = time.time()

                # Send info message about current pattern
                info_msg = self._create_message(MessageType.INFO, message=pattern.info_message)
                await self._send_sse_message(response, info_msg)
                total_info_count += 1

                # Additional contextual info messages
                if random.random() < 0.4:
                    context_messages = [
                        f"System load at {random.randint(60, 95)}% capacity",
                        f"Payment gateway response time: {random.randint(50, 200)}ms",
                        f"Order processing queue depth: {random.randint(100, 1000)}",
                        f"Active sessions: {random.randint(5000, 50000)}",
                        f"Cache hit rate: {random.randint(85, 99)}%"
                    ]
                    context_msg = self._create_message(MessageType.INFO, message=random.choice(context_messages))
                    await self._send_sse_message(response, context_msg)
                    total_info_count += 1

                # Check for scaling needs
                for entity in ["order", "payment"]:
                    scale_msg = self._should_scale(pattern.spawn_rate, entity)
                    if scale_msg:
                        await self._send_sse_message(response, scale_msg)
                        total_scale_count += 1
                        await asyncio.sleep(0.1)

                # Generate spawn messages for this pattern
                messages_in_pattern = 0
                while time.time() - pattern_start < pattern.duration:
                    # Calculate dynamic spawn rate with some variation
                    current_rate = pattern.spawn_rate * random.uniform(0.7, 1.3)
                    messages_to_send = int(current_rate)

                    # Send burst of spawn messages
                    for _ in range(messages_to_send):
                        spawn_msg = self._create_message(MessageType.SPAWN)
                        await self._send_sse_message(response, spawn_msg)
                        total_spawn_count += 1
                        messages_in_pattern += 1

                        # Small delay between messages to prevent overwhelming
                        if total_spawn_count % 50 == 0:
                            await asyncio.sleep(0.01)

                    # Occasional info messages during high traffic
                    if messages_in_pattern % 100 == 0 and random.random() < 0.3:
                        traffic_info = [
                            f"Processed {messages_in_pattern} orders in current cycle",
                            f"Node utilization: Order={self.order_nodes}, Payment={self.payment_nodes}",
                            f"Current throughput: {int(current_rate * 60)} orders/minute"
                        ]
                        info_msg = self._create_message(MessageType.INFO, message=random.choice(traffic_info))
                        await self._send_sse_message(response, info_msg)
                        total_info_count += 1

                    # Sleep to maintain rate
                    await asyncio.sleep(1.0)

                    # Check if we've exceeded our time limit
                    if time.time() - self.start_time > 180:  # 3 minutes max
                        break

                if time.time() - self.start_time > 180:
                    break

        except Exception as e:
            logger.error(f"Error in stream generation: {e}")

        finally:
            # Send end message
            end_msg = self._create_message(MessageType.END)
            await self._send_sse_message(response, end_msg)

            duration = time.time() - self.start_time
            logger.info(f"Stream ended. Duration: {duration:.1f}s, Spawn: {total_spawn_count}, Info: {total_info_count}, Scale: {total_scale_count}")

    async def _send_sse_message(self, response: StreamResponse, message: Dict[str, Any]):
        """Send a message in SSE format"""
        data = f"data: {json.dumps(message)}\n\n"
        await response.write(data.encode('utf-8'))

class FlowProbeServer:
    def __init__(self, host: str = '0.0.0.0', port: int = 8080):
        self.host = host
        self.port = port
        self.app = web.Application()
        self._setup_routes()

    def _setup_routes(self):
        """Setup server routes"""
        self.app.router.add_get('/stream', self.handle_stream)

    async def handle_stream(self, request):
        """Handle SSE stream requests"""
        response = web.StreamResponse()
        response.headers['Content-Type'] = 'text/event-stream'
        response.headers['Cache-Control'] = 'no-cache'
        response.headers['Connection'] = 'keep-alive'
        response.headers['Access-Control-Allow-Origin'] = '*'

        await response.prepare(request)

        simulator = FlowProbeSimulator()
        await simulator.generate_stream(response)

        return response

    def run(self):
        """Start the server"""
        logger.info(f"Starting flowProbe SSE server on {self.host}:{self.port}")
        web.run_app(self.app, host=self.host, port=self.port)

if __name__ == "__main__":
    server = FlowProbeServer()
    server.run()