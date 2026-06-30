import { randomUUID } from "crypto";
import { Pool, type PoolClient, type QueryResultRow } from "pg";
import type {
  MealType,
  MenuItemKind,
  OrderStatus,
  PaymentStatus,
  SenderType,
  SlotType,
  UserRole
} from "@/lib/db-types";
import { env } from "@/lib/env";

type DbClient = Pool | PoolClient;

type ProfileRow = {
  id: string;
  email: string | null;
  fullName: string | null;
  avatarUrl: string | null;
  role: UserRole;
  createdAt?: Date | string;
  updatedAt?: Date | string;
};

type MenuItemComponentRow = {
  id: string;
  menuItemId: string;
  itemName: string;
};

type MenuItemRow = {
  id: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  imageUrl: string;
  mealType: MealType;
  itemKind: MenuItemKind;
  badge: string;
  isActive: boolean;
  availableDate: Date | string | null;
  stockLimit: number;
  createdAt: Date | string;
  updatedAt: Date | string;
  components?: MenuItemComponentRow[] | string | null;
};

type OrderItemRow = {
  id: string;
  orderId: string;
  menuItemId: string | null;
  itemName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
};

type OrderRow = {
  id: string;
  orderNumber: string;
  checkoutToken: string;
  userId: string | null;
  customerName: string;
  phone: string;
  address: string;
  landmark: string | null;
  latitude: number | null;
  longitude: number | null;
  distanceKm: number | null;
  slotType: SlotType;
  subtotal: number;
  deliveryCharge: number;
  totalAmount: number;
  advanceAmount: number;
  balanceAmount: number;
  paymentStatus: PaymentStatus;
  orderStatus: OrderStatus;
  paymentUtr: string | null;
  paymentScreenshotUrl: string | null;
  createdAt: Date | string;
  updatedAt: Date | string;
  items?: OrderItemRow[];
};

type ChatRow = {
  id: string;
  customerName: string;
  phone: string;
  orderId: string | null;
  createdAt: Date | string;
  updatedAt: Date | string;
  messages?: ChatMessageRow[];
  order?: OrderRow | null;
};

type ChatMessageRow = {
  id: string;
  chatId: string;
  senderType: SenderType;
  message: string;
  seen: boolean;
  createdAt: Date | string;
};

type SettingRow = {
  id: string;
  kitchenLatitude: number;
  kitchenLongitude: number;
  lunchCloseTime: string;
  dinnerOpenTime: string;
  dinnerCloseTime: string;
  freeDeliveryOneKmMin: number;
  freeDeliveryTwoKmMin: number;
  aboveTwoKmDeliveryCharge: number;
  lowOrderDeliveryCharge: number;
  upiId: string;
  qrImageUrl: string;
  createdAt?: Date | string;
  updatedAt?: Date | string;
};

declare global {
  // eslint-disable-next-line no-var
  var saswatiDbPool: Pool | undefined;
}

function shouldUseSsl(connectionString: string) {
  return !/(localhost|127\.0\.0\.1)/i.test(connectionString);
}

function getPool() {
  if (!env.databaseUrl) {
    throw new Error("DATABASE_URL is not configured.");
  }

  if (!global.saswatiDbPool) {
    global.saswatiDbPool = new Pool({
      connectionString: env.databaseUrl,
      ssl: shouldUseSsl(env.databaseUrl) ? { rejectUnauthorized: false } : undefined
    });
  }

  return global.saswatiDbPool;
}

async function query<T extends QueryResultRow>(
  text: string,
  values: unknown[] = [],
  client?: DbClient
) {
  return (client ?? getPool()).query<T>(text, values);
}

async function withTransaction<T>(work: (client: PoolClient) => Promise<T>) {
  const client = await getPool().connect();
  try {
    await client.query("begin");
    const result = await work(client);
    await client.query("commit");
    return result;
  } catch (error) {
    await client.query("rollback");
    throw error;
  } finally {
    client.release();
  }
}

function parseJsonArray<T>(value: T[] | string | null | undefined) {
  if (!value) return [] as T[];
  if (typeof value === "string") return JSON.parse(value) as T[];
  return value;
}

function asDate(value: Date | string | null | undefined) {
  return value ? new Date(value) : value ?? null;
}

function mapProfile(row: ProfileRow | null) {
  if (!row) return null;
  return {
    ...row,
    createdAt: asDate(row.createdAt),
    updatedAt: asDate(row.updatedAt)
  };
}

function mapMenuItem(row: MenuItemRow) {
  return {
    ...row,
    availableDate: asDate(row.availableDate),
    createdAt: asDate(row.createdAt) as Date,
    updatedAt: asDate(row.updatedAt) as Date,
    components: parseJsonArray<MenuItemComponentRow>(row.components)
  };
}

function mapOrderItem(row: OrderItemRow) {
  return row;
}

function mapOrder(row: OrderRow) {
  return {
    ...row,
    createdAt: asDate(row.createdAt) as Date,
    updatedAt: asDate(row.updatedAt) as Date,
    items: (row.items ?? []).map(mapOrderItem)
  };
}

function mapChatMessage(row: ChatMessageRow) {
  return {
    ...row,
    createdAt: asDate(row.createdAt) as Date
  };
}

function mapChat(row: ChatRow) {
  return {
    ...row,
    createdAt: asDate(row.createdAt) as Date,
    updatedAt: asDate(row.updatedAt) as Date,
    order: row.order ? mapOrder(row.order) : row.order,
    messages: (row.messages ?? []).map(mapChatMessage)
  };
}

function mapSetting(row: SettingRow | null) {
  if (!row) return null;
  return {
    ...row,
    createdAt: asDate(row.createdAt) as Date | null,
    updatedAt: asDate(row.updatedAt) as Date | null
  };
}

async function loadOrderItems(orderIds: string[], client?: DbClient) {
  if (!orderIds.length) return new Map<string, OrderItemRow[]>();

  const { rows } = await query<OrderItemRow>(
    `
      select
        id,
        "orderId" as "orderId",
        "menuItemId" as "menuItemId",
        "itemName" as "itemName",
        quantity,
        "unitPrice" as "unitPrice",
        "totalPrice" as "totalPrice"
      from "OrderItem"
      where "orderId" = any($1::text[])
      order by id asc
    `,
    [orderIds],
    client
  );

  const itemsByOrderId = new Map<string, OrderItemRow[]>();
  for (const row of rows) {
    const bucket = itemsByOrderId.get(row.orderId) ?? [];
    bucket.push(row);
    itemsByOrderId.set(row.orderId, bucket);
  }
  return itemsByOrderId;
}

async function loadOrders(whereSql = "", values: unknown[] = [], options?: { take?: number }, client?: DbClient) {
  const takeSql = options?.take ? `limit ${options.take}` : "";
  const { rows } = await query<OrderRow>(
    `
      select
        id,
        "orderNumber" as "orderNumber",
        "checkoutToken" as "checkoutToken",
        "userId" as "userId",
        "customerName" as "customerName",
        phone,
        address,
        landmark,
        latitude,
        longitude,
        "distanceKm" as "distanceKm",
        "slotType" as "slotType",
        subtotal,
        "deliveryCharge" as "deliveryCharge",
        "totalAmount" as "totalAmount",
        "advanceAmount" as "advanceAmount",
        "balanceAmount" as "balanceAmount",
        "paymentStatus" as "paymentStatus",
        "orderStatus" as "orderStatus",
        "paymentUtr" as "paymentUtr",
        "paymentScreenshotUrl" as "paymentScreenshotUrl",
        "createdAt" as "createdAt",
        "updatedAt" as "updatedAt"
      from "Order"
      ${whereSql}
      order by "createdAt" desc
      ${takeSql}
    `,
    values,
    client
  );

  const orderIds = rows.map((row) => row.id);
  const itemsByOrderId = await loadOrderItems(orderIds, client);

  return rows.map((row) =>
    mapOrder({
      ...row,
      items: itemsByOrderId.get(row.id) ?? []
    })
  );
}

async function loadMenuItems(args?: any, client?: DbClient) {
  const clauses: string[] = [];
  const values: unknown[] = [];

  if (typeof args?.where?.isActive === "boolean") {
    values.push(args.where.isActive);
    clauses.push(`m."isActive" = $${values.length}`);
  }

  if (Array.isArray(args?.where?.id?.in) && args.where.id.in.length) {
    values.push(args.where.id.in);
    clauses.push(`m.id = any($${values.length}::text[])`);
  }

  const whereSql = clauses.length ? `where ${clauses.join(" and ")}` : "";
  const orderBySql =
    Array.isArray(args?.orderBy) && args.orderBy[0]?.price
      ? `order by m.price ${String(args.orderBy[0].price).toUpperCase() === "ASC" ? "asc" : "desc"}`
      : args?.orderBy?.createdAt
        ? `order by m."createdAt" ${String(args.orderBy.createdAt).toUpperCase() === "ASC" ? "asc" : "desc"}`
        : `order by m."createdAt" desc`;

  const { rows } = await query<MenuItemRow>(
    `
      select
        m.id,
        m.name,
        m.slug,
        m.description,
        m.price,
        m."imageUrl" as "imageUrl",
        m."mealType" as "mealType",
        m."itemKind" as "itemKind",
        m.badge,
        m."isActive" as "isActive",
        m."availableDate" as "availableDate",
        m."stockLimit" as "stockLimit",
        m."createdAt" as "createdAt",
        m."updatedAt" as "updatedAt",
        coalesce(
          json_agg(
            json_build_object(
              'id', c.id,
              'menuItemId', c."menuItemId",
              'itemName', c."itemName"
            )
            order by c.id
          ) filter (where c.id is not null),
          '[]'::json
        ) as components
      from "MenuItem" m
      left join "MenuItemComponent" c on c."menuItemId" = m.id
      ${whereSql}
      group by m.id
      ${orderBySql}
    `,
    values,
    client
  );

  return rows.map(mapMenuItem);
}

async function loadChatMessages(chatIds: string[], client?: DbClient) {
  if (!chatIds.length) return new Map<string, ChatMessageRow[]>();

  const { rows } = await query<ChatMessageRow>(
    `
      select
        id,
        "chatId" as "chatId",
        "senderType" as "senderType",
        message,
        seen,
        "createdAt" as "createdAt"
      from "ChatMessage"
      where "chatId" = any($1::text[])
      order by "createdAt" asc
    `,
    [chatIds],
    client
  );

  const messagesByChatId = new Map<string, ChatMessageRow[]>();
  for (const row of rows) {
    const bucket = messagesByChatId.get(row.chatId) ?? [];
    bucket.push(row);
    messagesByChatId.set(row.chatId, bucket);
  }
  return messagesByChatId;
}

async function loadOrderById(orderId: string, client?: DbClient) {
  const orders = await loadOrders(`where id = $1`, [orderId], { take: 1 }, client);
  return orders[0] ?? null;
}

// ponytail: this adapter only implements the Prisma query shapes the app actually uses.
export const prisma = {
  profile: {
    async upsert(args: any) {
      const data = { ...args.create, ...args.update, id: args.where.id };
      const { rows } = await query<ProfileRow>(
        `
          insert into profiles (id, email, full_name, avatar_url, role, created_at, updated_at)
          values ($1, $2, $3, $4, $5, now(), now())
          on conflict (id) do update set
            email = excluded.email,
            full_name = excluded.full_name,
            avatar_url = excluded.avatar_url,
            role = excluded.role,
            updated_at = now()
          returning
            id,
            email,
            full_name as "fullName",
            avatar_url as "avatarUrl",
            role,
            created_at as "createdAt",
            updated_at as "updatedAt"
        `,
        [data.id, data.email ?? null, data.fullName ?? null, data.avatarUrl ?? null, data.role]
      );

      return mapProfile(rows[0]);
    },
    async findUnique(args: any) {
      const { rows } = await query<ProfileRow>(
        `
          select
            id,
            email,
            full_name as "fullName",
            avatar_url as "avatarUrl",
            role,
            created_at as "createdAt",
            updated_at as "updatedAt"
          from profiles
          where id = $1
          limit 1
        `,
        [args.where.id]
      );

      return mapProfile(rows[0] ?? null);
    }
  },
  setting: {
    async findFirst() {
      const { rows } = await query<SettingRow>(
        `
          select
            id,
            "kitchenLatitude" as "kitchenLatitude",
            "kitchenLongitude" as "kitchenLongitude",
            "lunchCloseTime" as "lunchCloseTime",
            "dinnerOpenTime" as "dinnerOpenTime",
            "dinnerCloseTime" as "dinnerCloseTime",
            "freeDeliveryOneKmMin" as "freeDeliveryOneKmMin",
            "freeDeliveryTwoKmMin" as "freeDeliveryTwoKmMin",
            "aboveTwoKmDeliveryCharge" as "aboveTwoKmDeliveryCharge",
            "lowOrderDeliveryCharge" as "lowOrderDeliveryCharge",
            "upiId" as "upiId",
            "qrImageUrl" as "qrImageUrl",
            "createdAt" as "createdAt",
            "updatedAt" as "updatedAt"
          from "Setting"
          order by "createdAt" asc
          limit 1
        `
      );

      return mapSetting(rows[0] ?? null);
    },
    async update(args: any) {
      const data = args.data;
      const { rows } = await query<SettingRow>(
        `
          update "Setting"
          set
            "kitchenLatitude" = $2,
            "kitchenLongitude" = $3,
            "lunchCloseTime" = $4,
            "dinnerOpenTime" = $5,
            "dinnerCloseTime" = $6,
            "freeDeliveryOneKmMin" = $7,
            "freeDeliveryTwoKmMin" = $8,
            "aboveTwoKmDeliveryCharge" = $9,
            "lowOrderDeliveryCharge" = $10,
            "upiId" = $11,
            "qrImageUrl" = $12,
            "updatedAt" = now()
          where id = $1
          returning
            id,
            "kitchenLatitude" as "kitchenLatitude",
            "kitchenLongitude" as "kitchenLongitude",
            "lunchCloseTime" as "lunchCloseTime",
            "dinnerOpenTime" as "dinnerOpenTime",
            "dinnerCloseTime" as "dinnerCloseTime",
            "freeDeliveryOneKmMin" as "freeDeliveryOneKmMin",
            "freeDeliveryTwoKmMin" as "freeDeliveryTwoKmMin",
            "aboveTwoKmDeliveryCharge" as "aboveTwoKmDeliveryCharge",
            "lowOrderDeliveryCharge" as "lowOrderDeliveryCharge",
            "upiId" as "upiId",
            "qrImageUrl" as "qrImageUrl",
            "createdAt" as "createdAt",
            "updatedAt" as "updatedAt"
        `,
        [
          args.where.id,
          data.kitchenLatitude,
          data.kitchenLongitude,
          data.lunchCloseTime,
          data.dinnerOpenTime,
          data.dinnerCloseTime,
          data.freeDeliveryOneKmMin,
          data.freeDeliveryTwoKmMin,
          data.aboveTwoKmDeliveryCharge,
          data.lowOrderDeliveryCharge,
          data.upiId,
          data.qrImageUrl
        ]
      );

      return mapSetting(rows[0])!;
    },
    async create(args: any) {
      const data = args.data;
      const id = data.id ?? randomUUID();
      const { rows } = await query<SettingRow>(
        `
          insert into "Setting" (
            id,
            "kitchenLatitude",
            "kitchenLongitude",
            "lunchCloseTime",
            "dinnerOpenTime",
            "dinnerCloseTime",
            "freeDeliveryOneKmMin",
            "freeDeliveryTwoKmMin",
            "aboveTwoKmDeliveryCharge",
            "lowOrderDeliveryCharge",
            "upiId",
            "qrImageUrl",
            "createdAt",
            "updatedAt"
          )
          values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, now(), now())
          returning
            id,
            "kitchenLatitude" as "kitchenLatitude",
            "kitchenLongitude" as "kitchenLongitude",
            "lunchCloseTime" as "lunchCloseTime",
            "dinnerOpenTime" as "dinnerOpenTime",
            "dinnerCloseTime" as "dinnerCloseTime",
            "freeDeliveryOneKmMin" as "freeDeliveryOneKmMin",
            "freeDeliveryTwoKmMin" as "freeDeliveryTwoKmMin",
            "aboveTwoKmDeliveryCharge" as "aboveTwoKmDeliveryCharge",
            "lowOrderDeliveryCharge" as "lowOrderDeliveryCharge",
            "upiId" as "upiId",
            "qrImageUrl" as "qrImageUrl",
            "createdAt" as "createdAt",
            "updatedAt" as "updatedAt"
        `,
        [
          id,
          data.kitchenLatitude,
          data.kitchenLongitude,
          data.lunchCloseTime,
          data.dinnerOpenTime,
          data.dinnerCloseTime,
          data.freeDeliveryOneKmMin,
          data.freeDeliveryTwoKmMin,
          data.aboveTwoKmDeliveryCharge,
          data.lowOrderDeliveryCharge,
          data.upiId,
          data.qrImageUrl
        ]
      );

      return mapSetting(rows[0])!;
    }
  },
  menuItem: {
    findMany(args?: any) {
      return loadMenuItems(args);
    },
    async count() {
      const { rows } = await query<{ count: string }>(`select count(*)::text as count from "MenuItem"`);
      return Number(rows[0]?.count ?? 0);
    },
    async create(args: any) {
      return withTransaction(async (client) => {
        const data = args.data;
        const id = randomUUID();

        await query(
          `
            insert into "MenuItem" (
              id, name, slug, description, price, "imageUrl", "mealType", "itemKind", badge,
              "isActive", "availableDate", "stockLimit", "createdAt", "updatedAt"
            )
            values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, now(), now())
          `,
          [
            id,
            data.name,
            data.slug,
            data.description,
            data.price,
            data.imageUrl,
            data.mealType,
            data.itemKind ?? "THALI",
            data.badge,
            data.isActive ?? true,
            data.availableDate ?? null,
            data.stockLimit ?? 0
          ],
          client
        );

        for (const component of data.components?.create ?? []) {
          await query(
            `
              insert into "MenuItemComponent" (id, "menuItemId", "itemName")
              values ($1, $2, $3)
            `,
            [randomUUID(), id, component.itemName],
            client
          );
        }

        const [item] = await loadMenuItems({ where: { id: { in: [id] } } }, client);
        return item;
      });
    },
    async update(args: any) {
      return withTransaction(async (client) => {
        const data = args.data ?? {};
        const values: unknown[] = [args.where.id];
        const assignments: string[] = [];
        const fieldMap: Array<[string, keyof typeof data]> = [
          [`name`, "name"],
          [`slug`, "slug"],
          [`description`, "description"],
          [`price`, "price"],
          [`"imageUrl"`, "imageUrl"],
          [`"mealType"`, "mealType"],
          [`"itemKind"`, "itemKind"],
          [`badge`, "badge"],
          [`"isActive"`, "isActive"],
          [`"availableDate"`, "availableDate"],
          [`"stockLimit"`, "stockLimit"]
        ];

        for (const [column, key] of fieldMap) {
          if (Object.prototype.hasOwnProperty.call(data, key)) {
            values.push(data[key]);
            assignments.push(`${column} = $${values.length}`);
          }
        }

        if (assignments.length) {
          await query(
            `
              update "MenuItem"
              set ${assignments.join(", ")}, "updatedAt" = now()
              where id = $1
            `,
            values,
            client
          );
        }

        for (const component of data.components?.create ?? []) {
          await query(
            `
              insert into "MenuItemComponent" (id, "menuItemId", "itemName")
              values ($1, $2, $3)
            `,
            [randomUUID(), args.where.id, component.itemName],
            client
          );
        }

        const [item] = await loadMenuItems({ where: { id: { in: [args.where.id] } } }, client);
        return item;
      });
    },
    async delete(args: any) {
      const { rows } = await query<MenuItemRow>(
        `delete from "MenuItem" where id = $1 returning *`,
        [args.where.id]
      );
      return rows[0] ?? null;
    }
  },
  menuItemComponent: {
    async deleteMany(args: any) {
      await query(`delete from "MenuItemComponent" where "menuItemId" = $1`, [args.where.menuItemId]);
      return { count: 0 };
    }
  },
  order: {
    async findUnique(args: any) {
      if (args.where.checkoutToken) {
        const [order] = await loadOrders(`where "checkoutToken" = $1`, [args.where.checkoutToken], { take: 1 });
        return order ?? null;
      }

      if (args.where.orderNumber) {
        const [order] = await loadOrders(`where "orderNumber" = $1`, [args.where.orderNumber], { take: 1 });
        return order ?? null;
      }

      if (args.where.id) {
        const [order] = await loadOrders(`where id = $1`, [args.where.id], { take: 1 });
        return order ?? null;
      }

      return null;
    },
    async create(args: any) {
      return withTransaction(async (client) => {
        const data = args.data;
        const id = data.id ?? randomUUID();

        await query(
          `
            insert into "Order" (
              id,
              "orderNumber",
              "checkoutToken",
              "userId",
              "customerName",
              phone,
              address,
              landmark,
              latitude,
              longitude,
              "distanceKm",
              "slotType",
              subtotal,
              "deliveryCharge",
              "totalAmount",
              "advanceAmount",
              "balanceAmount",
              "paymentStatus",
              "orderStatus",
              "paymentUtr",
              "paymentScreenshotUrl",
              "createdAt",
              "updatedAt"
            )
            values (
              $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, now(), now()
            )
          `,
          [
            id,
            data.orderNumber,
            data.checkoutToken,
            data.userId ?? null,
            data.customerName,
            data.phone,
            data.address,
            data.landmark ?? null,
            data.latitude ?? null,
            data.longitude ?? null,
            data.distanceKm ?? null,
            data.slotType,
            data.subtotal,
            data.deliveryCharge,
            data.totalAmount,
            data.advanceAmount,
            data.balanceAmount,
            data.paymentStatus ?? "PENDING_VERIFICATION",
            data.orderStatus ?? "PAYMENT_PENDING_VERIFICATION",
            data.paymentUtr ?? null,
            data.paymentScreenshotUrl ?? null
          ],
          client
        );

        for (const item of data.items?.create ?? []) {
          await query(
            `
              insert into "OrderItem" (
                id,
                "orderId",
                "menuItemId",
                "itemName",
                quantity,
                "unitPrice",
                "totalPrice"
              )
              values ($1, $2, $3, $4, $5, $6, $7)
            `,
            [
              randomUUID(),
              id,
              item.menuItemId ?? null,
              item.itemName,
              item.quantity,
              item.unitPrice,
              item.totalPrice
            ],
            client
          );
        }

        return loadOrderById(id, client);
      });
    },
    findMany(args: any) {
      if (args?.where?.userId) {
        return loadOrders(`where "userId" = $1`, [args.where.userId], { take: args.take });
      }

      return loadOrders("", [], { take: args?.take });
    },
    async update(args: any) {
      const setClauses = ['"updatedAt" = now()'];
      const values: Array<string | null> = [args.where.id];

      if (args.data.orderStatus !== undefined) {
        values.push(args.data.orderStatus);
        setClauses.unshift(`"orderStatus" = $${values.length}`);
      }

      if (args.data.paymentStatus !== undefined) {
        values.push(args.data.paymentStatus);
        setClauses.unshift(`"paymentStatus" = $${values.length}`);
      }

      const { rows } = await query<OrderRow>(
        `
          update "Order"
          set ${setClauses.join(", ")}
          where id = $1
          returning
            id,
            "orderNumber" as "orderNumber",
            "checkoutToken" as "checkoutToken",
            "userId" as "userId",
            "customerName" as "customerName",
            phone,
            address,
            landmark,
            latitude,
            longitude,
            "distanceKm" as "distanceKm",
            "slotType" as "slotType",
            subtotal,
            "deliveryCharge" as "deliveryCharge",
            "totalAmount" as "totalAmount",
            "advanceAmount" as "advanceAmount",
            "balanceAmount" as "balanceAmount",
            "paymentStatus" as "paymentStatus",
            "orderStatus" as "orderStatus",
            "paymentUtr" as "paymentUtr",
            "paymentScreenshotUrl" as "paymentScreenshotUrl",
            "createdAt" as "createdAt",
            "updatedAt" as "updatedAt"
        `,
        values
      );

      const order = rows[0];
      if (!order) {
        throw new Error("Order not found.");
      }
      return mapOrder({ ...order, items: [] });
    },
    async groupBy(_args?: any) {
      const { rows } = await query<{ orderStatus: string; _count: number }>(
        `
          select "orderStatus" as "orderStatus", count(*)::int as "_count"
          from "Order"
          group by "orderStatus"
          order by count(*) desc
        `
      );
      return rows;
    }
  },
  chat: {
    async findMany(_args?: any): Promise<any[]> {
      const { rows } = await query<ChatRow>(
        `
          select
            id,
            "customerName" as "customerName",
            phone,
            "orderId" as "orderId",
            "createdAt" as "createdAt",
            "updatedAt" as "updatedAt"
          from "Chat"
          order by "updatedAt" desc
        `
      );

      const messagesByChatId = await loadChatMessages(rows.map((row) => row.id));
      return rows.map((row) =>
        mapChat({
          ...row,
          messages: messagesByChatId.get(row.id) ?? []
        })
      );
    },
    async findFirst(args: any): Promise<any> {
      const values: unknown[] = [args.where.phone, args.where.customerName];
      const orderIdIsNull = args.where.orderId == null;
      const orderClause = orderIdIsNull
        ? `"orderId" is null`
        : `"orderId" = $3`;

      if (!orderIdIsNull) values.push(args.where.orderId);

      const { rows } = await query<ChatRow>(
        `
          select
            id,
            "customerName" as "customerName",
            phone,
            "orderId" as "orderId",
            "createdAt" as "createdAt",
            "updatedAt" as "updatedAt"
          from "Chat"
          where phone = $1 and "customerName" = $2 and ${orderClause}
          order by "updatedAt" desc
          limit 1
        `,
        values
      );

      const row = rows[0];
      if (!row) return null;
      const messagesByChatId = await loadChatMessages([row.id]);
      return mapChat({
        ...row,
        messages: messagesByChatId.get(row.id) ?? []
      });
    },
    async create(args: any): Promise<any> {
      const id = randomUUID();
      await query(
        `
          insert into "Chat" (id, "customerName", phone, "orderId", "createdAt", "updatedAt")
          values ($1, $2, $3, $4, now(), now())
        `,
        [id, args.data.customerName, args.data.phone, args.data.orderId ?? null]
      );

      return prisma.chat.findUnique({
        where: { id },
        include: { messages: true }
      });
    },
    async findUnique(args: any): Promise<any> {
      const { rows } = await query<ChatRow>(
        `
          select
            id,
            "customerName" as "customerName",
            phone,
            "orderId" as "orderId",
            "createdAt" as "createdAt",
            "updatedAt" as "updatedAt"
          from "Chat"
          where id = $1
          limit 1
        `,
        [args.where.id]
      );

      const row = rows[0];
      if (!row) return null;

      const [messagesByChatId, order] = await Promise.all([
        args.include?.messages ? loadChatMessages([row.id]) : Promise.resolve(new Map<string, ChatMessageRow[]>()),
        args.include?.order && row.orderId ? loadOrderById(row.orderId) : Promise.resolve(null)
      ]);

      const chat = mapChat({
        ...row,
        messages: messagesByChatId.get(row.id) ?? [],
        order
      });

      if (args.select?.customerName) {
        return { customerName: chat.customerName };
      }

      return chat;
    },
    async update(args: any) {
      const { rows } = await query<ChatRow>(
        `
          update "Chat"
          set "updatedAt" = $2
          where id = $1
          returning
            id,
            "customerName" as "customerName",
            phone,
            "orderId" as "orderId",
            "createdAt" as "createdAt",
            "updatedAt" as "updatedAt"
        `,
        [args.where.id, args.data.updatedAt ?? new Date()]
      );

      return rows[0] ? mapChat(rows[0]) : null;
    }
  },
  chatMessage: {
    async updateMany(args: any) {
      const { rowCount } = await query(
        `
          update "ChatMessage"
          set seen = $4
          where "chatId" = $1 and "senderType" = $2 and seen = $3
        `,
        [args.where.chatId, args.where.senderType, args.where.seen, args.data.seen]
      );

      return { count: rowCount ?? 0 };
    },
    async create(args: any) {
      const { rows } = await query<ChatMessageRow>(
        `
          insert into "ChatMessage" (
            id,
            "chatId",
            "senderType",
            message,
            seen,
            "createdAt"
          )
          values ($1, $2, $3, $4, $5, now())
          returning
            id,
            "chatId" as "chatId",
            "senderType" as "senderType",
            message,
            seen,
            "createdAt" as "createdAt"
        `,
        [randomUUID(), args.data.chatId, args.data.senderType, args.data.message, args.data.seen ?? false]
      );

      return mapChatMessage(rows[0]);
    }
  },
  adminPresence: {
    async upsert(args: any) {
      const data = { ...args.create, ...args.update, adminId: args.where.adminId };
      const { rows } = await query(
        `
          insert into "AdminPresence" (id, "adminId", "onlineStatus", "lastSeenAt")
          values ($1, $2, $3, $4)
          on conflict ("adminId") do update set
            "onlineStatus" = excluded."onlineStatus",
            "lastSeenAt" = excluded."lastSeenAt"
          returning id, "adminId" as "adminId", "onlineStatus" as "onlineStatus", "lastSeenAt" as "lastSeenAt"
        `,
        [randomUUID(), data.adminId, data.onlineStatus ?? false, data.lastSeenAt ?? new Date()]
      );

      return rows[0];
    }
  },
  adminHack: {
    async create(args: any) {
      const { rows } = await query(
        `
          insert into adminhack (id, email, ip_address, user_agent, created_at)
          values ($1, $2, $3, $4, now())
          returning id, email, ip_address as "ipAddress", user_agent as "userAgent", created_at as "createdAt"
        `,
        [randomUUID(), args.data.email ?? null, args.data.ipAddress ?? null, args.data.userAgent ?? null]
      );

      return rows[0];
    }
  }
};

export async function disconnectPrisma() {
  if (global.saswatiDbPool) {
    await global.saswatiDbPool.end();
    global.saswatiDbPool = undefined;
  }
}

export { query as dbQuery, withTransaction as withDbTransaction };

export function isPrismaConnectionError(error: unknown) {
  if (!(error instanceof Error)) return false;

  return /password authentication failed|connect ECONNREFUSED|ENOTFOUND|Connection terminated|database .* does not exist|no pg_hba|self signed certificate/i.test(
    error.message
  );
}

export function isPrismaSchemaMismatchError(error: unknown) {
  if (!(error instanceof Error)) return false;
  return /column .* does not exist|relation .* does not exist/i.test(error.message);
}
