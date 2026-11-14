import { auth } from "@clerk/nextjs";
import { redirect } from "next/navigation";

import prismadb from "@/lib/prismadb";
import MarketplaceClient, {
	MarketplaceProduct,
} from "./components/client";

const MarketplacePage = async ({
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

	const products = await prismadb.product.findMany({
		where: {
			isArchived: false,
			store: {
				userId: {
					not: userId,
				},
			},
		},
		include: {
			images: true,
			store: true,
			category: true,
		},
		orderBy: {
			createdAt: "desc",
		},
	});

	const formattedProducts: MarketplaceProduct[] = products.map((product) => ({
		id: product.id,
		name: product.name,
		price: product.price.toNumber(),
		imageUrl: product.images[0]?.url || null,
		category: product.category.name,
		storeId: product.storeId,
		storeName: product.store.name,
	}));

	return <MarketplaceClient products={formattedProducts} />;
};

export default MarketplacePage;
