// Phone-based authentication types

export type User = {
  id: number;
  name: string | null;
  phoneNumber: string;
  role: "user" | "leader" | "admin";
  groupId: number | null;
};

export namespace Auth {
  export type User = {
    id: number;
    name: string | null;
    phoneNumber: string;
    role: "user" | "leader" | "admin";
    groupId: number | null;
  };
}
