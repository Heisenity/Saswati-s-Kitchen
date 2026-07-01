import { Header } from "@/components/site/header";
import { Footer } from "@/components/site/footer";
import { Card } from "@/components/ui/card";
import { GuestOrderLookup } from "@/components/account/guest-order-lookup";
import { CustomerAuthCard } from "@/components/auth/customer-auth-card";
import { getSessionContext } from "@/lib/auth";
import { getOrdersForUser } from "@/lib/orders";
import { formatCurrency, formatDateTime } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function AccountPage() {
  const { user, profile } = await getSessionContext();
  const orders = user ? await getOrdersForUser(user.id) : [];

  return (
    <main>
      <Header />
      <div className="section-padding">
        <div className="mx-auto grid max-w-5xl gap-6">
          {user ? (
            <Card className="p-8">
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-primary">
                Account
              </p>
              <h1 className="mt-3 font-serif text-4xl">Your orders and profile</h1>
              <div className="mt-6 grid gap-4 md:grid-cols-2">
                <Info label="Email" value={user.email ?? "No email"} />
                <Info label="Role" value={profile?.role ?? "USER"} />
                <Info
                  label="Name"
                  value={
                    profile?.fullName ??
                    (typeof user.user_metadata?.full_name === "string"
                      ? user.user_metadata.full_name
                      : "Not set")
                  }
                />
                <Info label="Phone" value={user.phone ?? "Not linked"} />
              </div>
              <form action="/auth/signout" method="post" className="mt-8">
                <button className="rounded-full bg-primary px-5 py-3 text-sm font-semibold text-white">
                  Sign out
                </button>
              </form>
            </Card>
          ) : (
            <div className="mx-auto w-full max-w-md">
              <CustomerAuthCard next="/account" />
            </div>
          )}

          {user ? (
            <Card className="p-8">
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-primary">My orders</p>
              <h2 className="mt-3 font-serif text-3xl">Orders placed while signed in</h2>
              <div className="mt-6 max-h-[70vh] space-y-4 overflow-y-auto pr-1">
                {orders.length ? (
                  orders.map((order) => (
                    <div key={order.id} className="rounded-3xl border border-border bg-muted p-5">
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <p className="font-semibold text-foreground">{order.orderNumber}</p>
                          <p className="text-sm text-stone-600">
                            {formatDateTime(order.createdAt)} · {order.slotType}
                          </p>
                        </div>
                        <a href={`/receipt/${order.orderNumber}`} className="text-sm font-semibold text-primary">
                          View details
                        </a>
                      </div>
                      <div className="mt-4 grid gap-3 md:grid-cols-3">
                        <Info label="Total" value={formatCurrency(order.totalAmount)} />
                        <Info label="Payment" value={order.paymentStatus.replaceAll("_", " ")} />
                        <Info label="Status" value={order.orderStatus.replaceAll("_", " ")} />
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="rounded-3xl bg-muted px-4 py-4 text-sm text-stone-600">
                    No signed-in orders yet. Older guest orders can still be found below with order ID and phone number.
                  </p>
                )}
              </div>
            </Card>
          ) : null}

          <GuestOrderLookup />
        </div>
      </div>
      <Footer />
    </main>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-3xl bg-muted px-4 py-4">
      <p className="text-xs uppercase tracking-[0.18em] text-stone-500">{label}</p>
      <p className="mt-2 break-all text-sm font-medium text-foreground">{value}</p>
    </div>
  );
}
