import { auth } from "@clerk/nextjs";
import prismadb from "@/lib/prismadb";
import { NextResponse } from "next/server";

export async function PATCH(
	req: Request,
	{ params }: { params: { orderId: string } }
) {
	try {
		const { userId } = auth();

		if (!userId) {
			return new NextResponse("Unauthenticated", { status: 403 });
		}

		const { action } = await req.json();
		const order = await prismadb.order.findUnique({
			where: {
				id: params.orderId,
			},
			include: {
				store: true,
			},
		});

		if (!order || order.store.userId !== userId) {
			return new NextResponse("Unauthorized", { status: 403 });
		}

		if (action === "approve" && order.status === "PENDING") {
			const updatedOrder = await prismadb.order.update({
				where: {
					id: order.id,
				},
				data: {
					status: "APPROVED",
				},
			});

			return NextResponse.json(updatedOrder);
		}

		if (action === "deny" && order.status === "PENDING") {
			const updatedOrder = await prismadb.order.update({
				where: {
					id: order.id,
				},
				data: {
					status: "DENIED",
				},
			});

			return NextResponse.json(updatedOrder);
		}

		if (action === "settle" && order.status === "APPROVED") {
			const updatedOrder = await prismadb.order.update({
				where: {
					id: order.id,
				},
				data: {
					isPaid: true,
				},
			});

			return NextResponse.json(updatedOrder);
		}

		return new NextResponse("Invalid order action", { status: 400 });
	} catch (error) {
		console.log("[ORDER_PATCH]", error);
		return new NextResponse("Internal error", { status: 500 });
	}
}
