"use client";

import axios from "axios";
import { useState } from "react";
import { toast } from "react-hot-toast";
import { useRouter } from "next/navigation";

import { Heading } from "@/components/ui/heading";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";

import { OrderColumn } from "./columns";

interface OrderClientProps {
	data: OrderColumn[];
}

export const OrderClient: React.FC<OrderClientProps> = ({ data }) => {
	const router = useRouter();
	const [loadingOrderId, setLoadingOrderId] = useState<string | null>(null);

	const updateOrder = async (
		orderId: string,
		action: "approve" | "deny" | "settle"
	) => {
		try {
			setLoadingOrderId(orderId);
			await axios.patch(`/api/orders/${orderId}`, { action });
			toast.success(
				action === "approve"
					? "Order approved."
					: action === "deny"
					? "Order denied."
					: "Payment marked as settled."
			);
			router.refresh();
		} catch {
			toast.error("Could not update this order.");
		} finally {
			setLoadingOrderId(null);
		}
	};

	return (
		<>
			<Heading
				title={`Orders (${data.length})`}
				description="Review requests from buyers"
			/>
			<Separator />
			<div className="space-y-4">
				{data.map((order) => (
					<div
						key={order.id}
						className="rounded-md border p-4 text-sm"
					>
						<div className="flex flex-wrap items-center justify-between gap-3">
							<div>
								<p className="font-medium">
									{order.products} · {order.totalPrice}
								</p>
								<p className="text-muted-foreground">
									{order.buyerName} · Room {order.roomNumber} · Roll{" "}
									{order.rollNumber} · {order.phone}
								</p>
							</div>
							<div className="flex items-center gap-2">
								<span className="capitalize text-muted-foreground">
									{order.status.toLowerCase()}
								</span>
								{order.status === "PENDING" && (
									<>
										<Button
											size="sm"
											disabled={loadingOrderId === order.id}
											onClick={() =>
												updateOrder(order.id, "approve")
											}
										>
											Approve
										</Button>
										<Button
											size="sm"
											variant="destructive"
											disabled={loadingOrderId === order.id}
											onClick={() =>
												updateOrder(order.id, "deny")
											}
										>
											Deny
										</Button>
									</>
								)}
								{order.status === "APPROVED" && !order.isPaid && (
									<Button
										size="sm"
										disabled={loadingOrderId === order.id}
										onClick={() =>
											updateOrder(order.id, "settle")
										}
									>
										Payment settled
									</Button>
								)}
								{order.status === "APPROVED" && order.isPaid && (
									<span className="text-green-600">Paid</span>
								)}
							</div>
						</div>
					</div>
				))}
				{data.length === 0 && (
					<p className="text-sm text-muted-foreground">
						No buyer requests yet.
					</p>
				)}
			</div>
		</>
	);
};
