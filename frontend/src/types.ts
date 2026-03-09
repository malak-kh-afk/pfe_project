export type Role = "user" | "assistant";

export type Msg = {
  id: string;
  role: Role;
  html: string;
  ts: number;
};

export type Session = {
  id: string;
  title: string;
  createdAt: number;
  messages: Msg[];
};

export type User = { name: string; email?: string } | null;

export type StatusText = "ready" | "typing";