// Where the shop manager's tabs get orders, customers, comments and tickets from: the server, or
// the sample (see sampleData.ts) while the shop has no activity of its own yet.

import { createContext, useContext } from "react";
import { api } from "../../api";
import type { ShopApi } from "./sampleData";

export const ShopApiContext = createContext<ShopApi>(api);
export const useShopApi = () => useContext(ShopApiContext);
