import { type Request } from "express";
import { db } from "./db";
import { jwtVerify } from "jose";

export interface Session {
  user: {
    id: string;
    email?: string;
    name?: string;
    image?: string;
  };
  expires: Date;
}

export async function auth(req: Request): Promise<Session | null> {
  const authHeader = req.headers.authorization;
  const cookieHeader = req.headers.cookie;

  let token: string | undefined;

  if (authHeader?.startsWith("Bearer ")) {
    token = authHeader.split(" ")[1];
  } else if (cookieHeader) {
    const cookies = Object.fromEntries(
      cookieHeader.split(";").map((c) => {
        const [key, ...rest] = c.trim().split("=");
        return [key.trim(), rest.join("=").trim()];
      })
    );
    token = cookies["auth-token"] || cookies["session-token"] || cookies["next-auth.session-token"];
  }

  if (!token) {
    return null;
  }

  try {
    const secret = new TextEncoder().encode(
      process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET || "fallback-secret-change-in-production"
    );

    const { payload } = await jwtVerify(token, secret, {
      algorithms: ["HS256"],
    });

    if (!payload.sub || !payload.exp) {
      return null;
    }

    return {
      user: {
        id: payload.sub as string,
        email: (payload.email as string) ?? undefined,
        name: (payload.name as string) ?? undefined,
        image: (payload.image as string) ?? undefined,
      },
      expires: new Date((payload.exp as number) * 1000),
    };
  } catch {
    try {
      const session = await db.session.findUnique({
        where: { sessionToken: token },
        include: { user: true },
      });

      if (!session || session.expires < new Date()) {
        return null;
      }

      return {
        user: {
          id: session.user.id,
          email: session.user.email ?? undefined,
          name: session.user.name ?? undefined,
          image: session.user.image ?? undefined,
        },
        expires: session.expires,
      };
    } catch {
      return null;
    }
  }
}
