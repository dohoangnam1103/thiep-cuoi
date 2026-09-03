import { RouteMessages } from "@/components/route-messages";

export default function MessagesLayout({ children }: { children: React.ReactNode }) {
  return <RouteMessages>{children}</RouteMessages>;
}
