import { auth } from "@clerk/nextjs";
import { redirect } from "next/navigation";

import prismadb from "@/lib/prismadb";
import MyOrdersClient, {
	MyOrder,
} from "./components/client";

const MyOrdersPage = async ({
	params,
}: {
	params: { storeId: string };
}) => {
	const { userId } = auth();

	if (!userId) {
		redirect("/sign-in");
	}

	const currentStore = await prismadb.store.findFirst({
		where: {
			id: params.storeId,
			userId,
		},
	});

	if (!currentStore) {
		redirect("/");
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

	const formattedOrders: MyOrder[] = orders.map((order) => ({
		id: order.id,
		storeName: order.store.name,
		status: order.status,
		isPaid: order.isPaid,
		createdAt: order.createdAt.toISOString(),
		products: order.orderItems.map((item) => ({
			name: item.product.name,
			price: item.unitPrice.toNumber(),
		})),
	}));

	return <MyOrdersClient initialOrders={formattedOrders} />;
};

export default MyOrdersPage;
