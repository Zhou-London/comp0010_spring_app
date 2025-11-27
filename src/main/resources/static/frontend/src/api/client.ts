import axios from "axios";

const api = axios.create({
  baseURL: "/",
  headers: {
    Accept: "application/hal+json, application/json",
    "Content-Type": "application/json",
  },
});

function normalize<T>(payload: any): T {
  if (Array.isArray(payload)) {
    return payload.map((item) => normalize(item)) as T;
  }

  if (payload && typeof payload === "object") {
    const { _links, _embedded, ...rest } = payload;
    Object.keys(rest).forEach((key) => {
      // @ts-expect-error dynamic assignment
      rest[key] = normalize(rest[key]);
    });
    return rest as T;
  }

  return payload as T;
}

function unwrapCollection<T>(payload: any): T[] {
  if (Array.isArray(payload)) {
    return payload.map((entry) => normalize<T>(entry));
  }

  if (payload?._embedded) {
    const embeddedArray = Object.values(payload._embedded).find(Array.isArray);
    if (embeddedArray && Array.isArray(embeddedArray)) {
      return embeddedArray.map((entry) => normalize<T>(entry));
    }
  }

  return [];
}

export async function fetchCollection<T>(path: string): Promise<T[]> {
  const response = await api.get(path);
  return unwrapCollection<T>(response.data);
}

export async function pingHealth(): Promise<boolean> {
  try {
    await api.get("/profile");
    return true;
  } catch (error) {
    return false;
  }
}
