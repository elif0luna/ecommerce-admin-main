"use client";

import { useEffect, useState } from "react";
import { useRef } from "react";
import { toast } from "react-hot-toast";
import axios from "axios";
import { format } from "date-fns";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Heading } from "@/components/ui/heading";
import { Separator } from "@/components/ui/separator";
import { formatter } from "@/lib/utils";

export type MyOrder = {
	id: string;
	storeName: string;
	status: "PENDING" | "APPROVED" | "DENIED";
	isPaid: boolean;
	createdAt: string;
	products: {
		name: string;
		price: number;
	}[];
};

interface MyOrdersClientProps {
	initialOrders: MyOrder[];
}

const MyOrdersClient: React.FC<MyOrdersClientProps> = ({ initialOrders }) => {
	const [orders, setOrders] = useState(initialOrders);
	const knownStatuses = useRef(
		new Map(initialOrders.map((order) => [order.id, order.status]))
	);

	useEffect(() => {
		const refreshOrders = async () => {
			try {
				const response = await axios.get("/api/marketplace/orders");
				const nextOrders: MyOrder[] = response.data.map((order: any) => ({
					id: order.id,
					storeName: order.store.name,
					status: order.status,
					isPaid: order.isPaid,
					createdAt: order.createdAt,
					products: order.orderItems.map((item: any) => ({
						name: item.product.name,
						price: Number(item.unitPrice),
					})),
				}));
				nextOrders.forEach((order) => {
					const previousStatus = knownStatuses.current.get(order.id);
					if (
						previousStatus &&
						previousStatus !== order.status &&
						order.status === "APPROVED"
					) {
						toast.success(
							`Your order was approved. Amount owed: ${formatter.format(
								order.products.reduce(
									(sum: number, product: { price: number }) =>
										sum + product.price,
									0
								)
							)}`
						);
					}
					knownStatuses.current.set(order.id, order.status);
				});
				setOrders(nextOrders);
			} catch {
				toast.error("Could not refresh order status.");
			}
		};

		const interval = window.setInterval(refreshOrders, 10000);
		return () => window.clearInterval(interval);
	}, []);

	return (
		<div className="flex-col">
			<div className="flex-1 space-y-6 p-8 pt-6">
				<Heading
					title="My orders"
					description="Track requests sent to other students"
				/>
				<Separator />
				{orders.length === 0 ? (
					<p className="text-sm text-muted-foreground">
						You have not requested any products yet.
					</p>
				) : (
					<div className="space-y-4">
						{orders.map((order) => {
							const total = order.products.reduce(
								(sum, product) => sum + product.price,
								0
							);

							return (
								<Card key={order.id}>
									<CardHeader>
										<div className="flex items-center justify-between">
											<CardTitle>{order.storeName}</CardTitle>
											<span className="text-sm text-muted-foreground">
												{format(
													new Date(order.createdAt),
													"MMMM do, yyyy"
												)}
											</span>
										</div>
									</CardHeader>
									<CardContent className="space-y-3">
										<p>
											{order.products
												.map((product) => product.name)
												.join(", ")}
										</p>
										<div className="flex flex-wrap gap-4 text-sm">
											<span>
												Amount owed: {formatter.format(total)}
											</span>
											<span>
												Status: {order.status.toLowerCase()}
											</span>
											{order.status === "APPROVED" && (
												<span>
													Payment:{" "}
													{order.isPaid
														? "settled"
														: "pending"}
												</span>
											)}
										</div>
									</CardContent>
								</Card>
							);
						})}
					</div>
				)}
			</div>
		</div>
	);
};

export default MyOrdersClient;
