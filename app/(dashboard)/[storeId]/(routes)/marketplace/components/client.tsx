"use client";

import axios from "axios";
import Image from "next/image";
import { useState } from "react";
import { toast } from "react-hot-toast";
import { ShoppingCart, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Heading } from "@/components/ui/heading";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { formatter } from "@/lib/utils";

export type MarketplaceProduct = {
	id: string;
	name: string;
	price: number;
	imageUrl: string | null;
	category: string;
	storeId: string;
	storeName: string;
};

interface MarketplaceClientProps {
	products: MarketplaceProduct[];
}

type BuyerDetails = {
	name: string;
	roomNumber: string;
	rollNumber: string;
	phoneNumber: string;
};

const emptyDetails: BuyerDetails = {
	name: "",
	roomNumber: "",
	rollNumber: "",
	phoneNumber: "",
};

const MarketplaceClient: React.FC<MarketplaceClientProps> = ({ products }) => {
	const [cart, setCart] = useState<MarketplaceProduct[]>([]);
	const [details, setDetails] = useState<BuyerDetails>(emptyDetails);
	const [showCheckout, setShowCheckout] = useState(false);
	const [loading, setLoading] = useState(false);

	const addToCart = (product: MarketplaceProduct) => {
		if (cart.some((item) => item.id === product.id)) {
			toast("This product is already in your cart.");
			return;
		}

		if (cart.length > 0 && cart[0].storeId !== product.storeId) {
			toast.error("Buy items from one supplier per request.");
			return;
		}

		setCart((current) => [...current, product]);
		toast.success("Added to cart.");
	};

	const removeFromCart = (productId: string) => {
		setCart((current) => current.filter((product) => product.id !== productId));
	};

	const submitOrder = async (event: React.FormEvent<HTMLFormElement>) => {
		event.preventDefault();

		try {
			setLoading(true);
			await axios.post("/api/marketplace/orders", {
				productIds: cart.map((product) => product.id),
				...details,
			});
			setCart([]);
			setDetails(emptyDetails);
			setShowCheckout(false);
			toast.success("Request sent to the supplier.");
		} catch (error) {
			toast.error("Could not send the request.");
		} finally {
			setLoading(false);
		}
	};

	const total = cart.reduce((sum, product) => sum + product.price, 0);

	return (
		<div className="flex-col">
			<div className="flex-1 space-y-6 p-8 pt-6">
				<div className="flex items-center justify-between">
					<Heading
						title="Marketplace"
						description="Buy products listed by other students"
					/>
					<div className="flex items-center gap-3">
						<span className="text-sm text-muted-foreground">
							{cart.length} item{cart.length === 1 ? "" : "s"} in cart
						</span>
						<Button
							disabled={!cart.length}
							onClick={() => setShowCheckout(true)}
						>
							<ShoppingCart className="mr-2 h-4 w-4" />
							Buy now
						</Button>
					</div>
				</div>
				<Separator />
				{products.length === 0 ? (
					<p className="text-sm text-muted-foreground">
						No products from other students are available yet.
					</p>
				) : (
					<div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
						{products.map((product) => (
							<Card key={product.id}>
								<div className="relative aspect-square overflow-hidden rounded-t-lg bg-muted">
									{product.imageUrl ? (
										<Image
											fill
											src={product.imageUrl}
											alt={product.name}
											className="object-cover"
										/>
									) : (
										<div className="flex h-full items-center justify-center text-sm text-muted-foreground">
											No image
										</div>
									)}
								</div>
								<CardHeader>
									<CardTitle>{product.name}</CardTitle>
									<p className="text-sm text-muted-foreground">
										{product.category} · {product.storeName}
									</p>
								</CardHeader>
								<CardContent className="flex items-center justify-between">
									<span className="font-semibold">
										{formatter.format(product.price)}
									</span>
									<Button
										size="sm"
										onClick={() => addToCart(product)}
										disabled={cart.some(
											(item) => item.id === product.id
										)}
									>
										Add to cart
									</Button>
								</CardContent>
							</Card>
						))}
					</div>
				)}
				{cart.length > 0 && (
					<Card>
						<CardHeader>
							<CardTitle>Cart</CardTitle>
						</CardHeader>
						<CardContent className="space-y-3">
							{cart.map((product) => (
								<div
									key={product.id}
									className="flex items-center justify-between"
								>
									<span>{product.name}</span>
									<div className="flex items-center gap-3">
										<span>{formatter.format(product.price)}</span>
										<Button
											variant="ghost"
											size="icon"
											onClick={() => removeFromCart(product.id)}
										>
											<Trash2 className="h-4 w-4" />
										</Button>
									</div>
								</div>
							))}
							<div className="border-t pt-3 text-right font-semibold">
								Total: {formatter.format(total)}
							</div>
						</CardContent>
					</Card>
				)}
				{showCheckout && (
					<Card>
						<CardHeader>
							<CardTitle>Buyer details</CardTitle>
							<p className="text-sm text-muted-foreground">
								The supplier will use these details to fulfill your request.
							</p>
						</CardHeader>
						<CardContent>
							<form onSubmit={submitOrder} className="space-y-4">
								<div className="grid gap-4 md:grid-cols-2">
									{(
										[
											["name", "Name"],
											["roomNumber", "Room number"],
											["rollNumber", "Roll number"],
											["phoneNumber", "Phone number"],
										] as const
									).map(([field, label]) => (
										<label key={field} className="space-y-2 text-sm">
											<span>{label}</span>
											<Input
												required
												value={details[field]}
												onChange={(event) =>
													setDetails((current) => ({
														...current,
														[field]: event.target.value,
													}))
												}
											/>
										</label>
									))}
								</div>
								<div className="flex gap-3">
									<Button type="submit" disabled={loading}>
										{loading ? "Sending..." : "Submit request"}
									</Button>
									<Button
										type="button"
										variant="outline"
										onClick={() => setShowCheckout(false)}
									>
										Cancel
									</Button>
								</div>
							</form>
						</CardContent>
					</Card>
				)}
			</div>
		</div>
	);
};

export default MarketplaceClient;
