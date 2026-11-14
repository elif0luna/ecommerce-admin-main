"use client";

import { ColumnDef } from "@tanstack/react-table";

export type OrderColumn = {
	id: string;
	buyerName: string;
	roomNumber: string;
	rollNumber: string;
	phone: string;
	address: string;
	isPaid: boolean;
	status: string;
	totalPrice: string;
	products: string;
	createdAt: string;
};

export const columns: ColumnDef<OrderColumn>[] = [
	{
		accessorKey: "products",
		header: "Products",
	},
	{
		accessorKey: "buyerName",
		header: "Buyer",
	},
	{
		accessorKey: "roomNumber",
		header: "Room",
	},
	{
		accessorKey: "rollNumber",
		header: "Roll number",
	},
	{
		accessorKey: "phone",
		header: "Phone",
	},
	{
		accessorKey: "address",
		header: "Address",
	},
	{
		accessorKey: "totalPrice",
		header: "Total price",
	},
	{
		accessorKey: "status",
		header: "Request",
	},
	{
		accessorKey: "isPaid",
		header: "Paid",
	},
];
