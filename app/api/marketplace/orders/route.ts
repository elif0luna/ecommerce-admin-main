import { auth } from "@clerk/nextjs";
import prismadb from "@/lib/prismadb";
import { NextResponse } from "next/server";

export async function GET() {
	try {
		const { userId } = auth();

		if (!userId) {
			return new NextResponse("Unauthenticated", { status: 403 });
		}

		const orders = await prismadb.order.findMany({
			where: {
				buyerId: userId,
			},
			include: {
				store: true,
				orderItems: {
					include: {
						product: true,
					},
				},
			},
			orderBy: {
				createdAt: "desc",
			},
		});

		return NextResponse.json(orders);
	} catch (error) {
		console.log("[MARKETPLACE_ORDERS_GET]", error);
		return new NextResponse("Internal error", { status: 500 });
	}
}

export async function POST(req: Request) {
	try {
		const { userId } = auth();

		if (!userId) {
			return new NextResponse("Unauthenticated", { status: 403 });
		}

		const body = await req.json();
		const {
			productIds,
			name,
			roomNumber,
			rollNumber,
			phoneNumber,
		} = body;

		if (!Array.isArray(productIds) || productIds.length === 0) {
			return new NextResponse("At least one product is required", {
				status: 400,
			});
		}

		if (!name || !roomNumber || !rollNumber || !phoneNumber) {
			return new NextResponse("All buyer details are required", {
				status: 400,
			});
		}

		const products = await prismadb.product.findMany({
			where: {
				id: {
					in: productIds,
				},
				isArchived: false,
				store: {
					userId: {
						not: userId,
					},
				},
			},
			select: {
				id: true,
				price: true,
				storeId: true,
			},
		});

		if (products.length !== productIds.length) {
			return new NextResponse(
				"One or more products are unavailable or belong to you",
				{ status: 400 }
			);
		}

		const storeIds = new Set(products.map((product) => product.storeId));

		if (storeIds.size !== 1) {
			return new NextResponse(
				"Cart items must belong to the same supplier",
				{ status: 400 }
			);
		}

		const order = await prismadb.order.create({
			data: {
				storeId: products[0].storeId,
				buyerId: userId,
				buyerName: name,
				roomNumber,
				rollNumber,
				phone: phoneNumber,
				orderItems: {
					create: products.map((product) => ({
						productId: product.id,
						unitPrice: product.price,
					})),
				},
			},
			include: {
				orderItems: true,
			},
		});

		return NextResponse.json(order, { status: 201 });
	} catch (error) {
		console.log("[MARKETPLACE_ORDERS_POST]", error);
		return new NextResponse("Internal error", { status: 500 });
	}
}
