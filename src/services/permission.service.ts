import { supabase } from "../lib/supabase.js";
import { createChildLogger } from "../lib/logger.js";
import type { Tables } from "../types/index.js";

const logger = createChildLogger("permission-service");

export class PermissionService {
  async findActivePermission(
    userId: string
  ): Promise<Tables<"quiz_permissions"> | null> {
    const { data, error } = await supabase
      .from("quiz_permissions")
      .select("*")
      .eq("user_id", userId)
      .eq("status", "APPROVED")
      .gt("remaining_quiz_accesses", 0)
      .order("purchased_at", { ascending: false })
      .limit(1)
      .single();

    if (error && error.code !== "PGRST116") {
      logger.error({ error, userId }, "Failed to find active permission");
      throw error;
    }

    return data;
  }

  async approve(userId: string): Promise<Tables<"quiz_permissions">> {
    const { data, error } = await supabase
      .from("quiz_permissions")
      .insert({
        user_id: userId,
        remaining_quiz_accesses: 1,
        status: "APPROVED",
        purchase_type: "PAYMENT",
      })
      .select()
      .single();

    if (error) {
      logger.error({ error, userId }, "Failed to approve permission");
      throw error;
    }

    logger.info({ permissionId: data.id, userId }, "Permission approved");
    return data;
  }

  async reject(userId: string): Promise<Tables<"quiz_permissions">> {
    const { data, error } = await supabase
      .from("quiz_permissions")
      .insert({
        user_id: userId,
        status: "REJECTED",
        purchase_type: "PAYMENT",
      })
      .select()
      .single();

    if (error) {
      logger.error({ error, userId }, "Failed to reject permission");
      throw error;
    }

    logger.info({ permissionId: data.id, userId }, "Permission rejected");
    return data;
  }

  async block(userId: string): Promise<Tables<"quiz_permissions">> {
    const { data, error } = await supabase
      .from("quiz_permissions")
      .insert({
        user_id: userId,
        status: "BLOCKED",
        purchase_type: "PAYMENT",
      })
      .select()
      .single();

    if (error) {
      logger.error({ error, userId }, "Failed to block permission");
      throw error;
    }

    logger.info({ permissionId: data.id, userId }, "Permission blocked");
    return data;
  }

  async consumeAccess(permissionId: string): Promise<void> {
    const { error } = await supabase
      .from("quiz_permissions")
      .update({ remaining_quiz_accesses: 0 })
      .eq("id", permissionId);

    if (error) {
      logger.error({ error, permissionId }, "Failed to consume access");
      throw error;
    }

    logger.info({ permissionId }, "Access consumed");
  }
}

export const permissionService = new PermissionService();
