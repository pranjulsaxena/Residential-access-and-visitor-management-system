import "next-auth";

declare module "next-auth" {
  interface User {
    id?: string;
    role?: string;
    gateId?: string;
    gateName?: string;
    flatId?: string;
    flatNumber?: string;
  }

  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      role: string;
      gateId?: string;
      gateName?: string;
      flatId?: string;
      flatNumber?: string;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    role?: string;
    gateId?: string;
    gateName?: string;
    flatId?: string;
    flatNumber?: string;
  }
}
