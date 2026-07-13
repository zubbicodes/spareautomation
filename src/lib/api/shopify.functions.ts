import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import {
  addCartLines,
  createCart,
  createCustomer,
  createCustomerAccessToken,
  getCart,
  getCollectionByHandle,
  getCustomer,
  getCustomerOrders,
  getProductByHandle,
  getProducts,
  getProductsPage,
  removeCartLine,
  recoverCustomerPassword,
  updateCartLine,
} from "../shopify/queries.server";
import {
  clearSession,
  useSession as getServerSessionManager,
} from "@tanstack/react-start/server";

const positiveQuantity = z.number().int().min(1).max(99);

export const getCollection = createServerFn({ method: "GET" })
  .inputValidator(
    z.object({
      handle: z.string().min(1),
      first: z.number().int().min(1).max(100).default(24),
    }),
  )
  .handler(async ({ data }) => getCollectionByHandle(data.handle, data.first));

export const getLatestProducts = createServerFn({ method: "GET" })
  .inputValidator(
    z.object({
      first: z.number().int().min(1).max(100).default(24),
      query: z.string().optional(),
    }),
  )
  .handler(async ({ data }) => getProducts(data.first, data.query));

export const getPaginatedProducts = createServerFn({ method: "GET" })
  .inputValidator(z.object({ first: z.number().int().min(1).max(100).default(48), query: z.string().optional(), after: z.string().optional() }))
  .handler(async ({ data }) => getProductsPage(data.first, data.query, data.after));

export const getProduct = createServerFn({ method: "GET" })
  .inputValidator(z.object({ handle: z.string().min(1) }))
  .handler(async ({ data }) => getProductByHandle(data.handle));

export const getShopifyCart = createServerFn({ method: "GET" })
  .inputValidator(z.object({ cartId: z.string().min(1) }))
  .handler(async ({ data }) => getCart(data.cartId));

export const addToShopifyCart = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      cartId: z.string().optional(),
      variantId: z.string().min(1),
      quantity: positiveQuantity,
    }),
  )
  .handler(async ({ data }) => {
    if (data.cartId) {
      return addCartLines(data.cartId, data.variantId, data.quantity);
    }
    return createCart(data.variantId, data.quantity);
  });

export const updateShopifyCartLine = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      cartId: z.string().min(1),
      lineId: z.string().min(1),
      quantity: z.number().int().min(0).max(99),
    }),
  )
  .handler(async ({ data }) => {
    if (data.quantity === 0) {
      return removeCartLine(data.cartId, data.lineId);
    }
    return updateCartLine(data.cartId, data.lineId, data.quantity);
  });

export const removeShopifyCartLine = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      cartId: z.string().min(1),
      lineId: z.string().min(1),
    }),
  )
  .handler(async ({ data }) => removeCartLine(data.cartId, data.lineId));

const CUSTOMER_ACCESS_TOKEN_SESSION_COOKIE = "sa_customer_access_token_session";
const SESSION_MAX_AGE = 60 * 60 * 24 * 14;

function sessionConfig(secret: string) {
  return {
    name: CUSTOMER_ACCESS_TOKEN_SESSION_COOKIE,
    password: secret,
    maxAge: SESSION_MAX_AGE,
    cookie: {
      httpOnly: true,
      sameSite: "lax" as const,
      secure: process.env.NODE_ENV === "production",
      path: "/",
    },
  };
}

async function getCustomerAccessTokenSession() {
  const secret = process.env.APP_SESSION_SECRET;
  if (!secret) return null;
  const session = await getServerSessionManager<{
    customerAccessToken?: string;
    expiresAt?: number;
  }>(sessionConfig(secret));
  if (!session.data.customerAccessToken) return null;
  if (session.data.expiresAt && session.data.expiresAt <= Date.now()) {
    await session.clear();
    return null;
  }
  return session.data;
}

async function clearCustomerAccessTokenSession() {
  const secret = process.env.APP_SESSION_SECRET;
  if (!secret) return;
  await clearSession({
    name: CUSTOMER_ACCESS_TOKEN_SESSION_COOKIE,
    password: secret,
    cookie: { path: "/" },
  });
}

export const loginShopifyCustomer = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      email: z.string().trim().email("Enter a valid email address"),
      password: z.string().min(1, "Password is required"),
    }),
  )
  .handler(async ({ data }) => {
    const result = await createCustomerAccessToken({
      email: data.email,
      password: data.password,
    });

    if (result.customerAccessToken) {
      const secret = process.env.APP_SESSION_SECRET;
      if (secret) {
        const session = await getServerSessionManager<{
          customerAccessToken?: string;
          expiresAt?: number;
        }>(sessionConfig(secret));
        await session.update({
          customerAccessToken: result.customerAccessToken.accessToken,
          expiresAt: new Date(result.customerAccessToken.expiresAt).getTime(),
        });
      }
    }

    return {
      authenticated: Boolean(result.customerAccessToken),
      errors: result.customerUserErrors.map((error) => ({
        code: error.code,
        message: error.message,
        field: error.field,
      })),
    };
  });

export const getShopifyCustomer = createServerFn({ method: "GET" }).handler(async () => {
  const sessionData = await getCustomerAccessTokenSession();
  if (!sessionData?.customerAccessToken) return null;
  const customer = await getCustomer(sessionData.customerAccessToken);
  if (!customer) return null;

  try {
    const orders = await getCustomerOrders(sessionData.customerAccessToken);
    return { ...customer, orders, orderHistoryAvailable: true as const };
  } catch {
    return { ...customer, orders: [], orderHistoryAvailable: false as const };
  }
});

export const logoutShopifyCustomer = createServerFn({ method: "POST" }).handler(async () => {
  await clearCustomerAccessTokenSession();
  return { ok: true };
});

export const requestShopifyPasswordReset = createServerFn({ method: "POST" })
  .inputValidator(z.object({ email: z.string().trim().email("Enter a valid email address") }))
  .handler(async ({ data }) => {
    const result = await recoverCustomerPassword(data.email);
    return { errors: result.customerUserErrors.map((error) => ({ code: error.code, message: error.message, field: error.field })) };
  });

export const createShopifyCustomer = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      firstName: z.string().trim().min(1, "First name is required").max(80),
      lastName: z.string().trim().min(1, "Last name is required").max(80),
      email: z.string().trim().email("Enter a valid email address"),
      phone: z
        .string()
        .trim()
        .max(20)
        .optional()
        .refine((phone) => !phone || /^\+[1-9]\d{6,14}$/.test(phone), {
          message: "Phone must be in international format, for example +923027458952",
        }),
      password: z.string().min(8, "Password must be at least 8 characters").max(72),
      acceptsMarketing: z.boolean().default(false),
    }),
  )
  .handler(async ({ data }) => {
    const result = await createCustomer({
      email: data.email,
      password: data.password,
      firstName: data.firstName,
      lastName: data.lastName,
      phone: data.phone || undefined,
      acceptsMarketing: data.acceptsMarketing,
    });

    return {
      customerId: result.customer?.id ?? null,
      errors: result.customerUserErrors.map((error) => ({
        code: error.code,
        message: error.message,
        field: error.field,
      })),
    };
  });
