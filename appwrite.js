import { Client, Databases, Account } from "https://cdn.jsdelivr.net/npm/appwrite@13.0.0/+esm";

const client = new Client();

client
  .setEndpoint("https://cloud.appwrite.io/v1")
  .setProject("PROJECT_ID"); // هتحطي الـ ID بتاعك هنا

export const databases = new Databases(client);
export const account = new Account(client);