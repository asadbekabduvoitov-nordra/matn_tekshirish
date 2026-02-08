import { supabase } from "../lib/supabase.js";
import { createChildLogger } from "../lib/logger.js";
import type { Tables, TablesInsert, TablesUpdate } from "../types/index.js";

const logger = createChildLogger("user-service");

export class UserService {
  async findByTelegramId(telegramId: number): Promise<Tables<"users"> | null> {
    const { data, error } = await supabase
      .from("users")
      .select("*")
      .eq("telegram_id", telegramId)
      .single();

    if (error && error.code !== "PGRST116") {
      logger.error({ error, telegramId }, "Failed to find user");
      throw error;
    }

    return data;
  }

  async create(user: TablesInsert<"users">): Promise<Tables<"users">> {
    const { data, error } = await supabase
      .from("users")
      .insert(user)
      .select()
      .single();

    if (error) {
      logger.error({ error, user }, "Failed to create user");
      throw error;
    }

    logger.info({ telegramId: user.telegram_id }, "User created");
    return data;
  }

  async update(
    telegramId: number,
    updates: TablesUpdate<"users">
  ): Promise<Tables<"users"> | null> {
    const { data, error } = await supabase
      .from("users")
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq("telegram_id", telegramId)
      .select()
      .single();

    if (error) {
      logger.error({ error, telegramId, updates }, "Failed to update user");
      throw error;
    }

    return data;
  }

  async upsert(user: Omit<TablesInsert<"users">, "username">): Promise<Tables<"users">> {
    const existing = await this.findByTelegramId(user.telegram_id);

    if (existing) {
      const updated = await this.update(user.telegram_id, {
        first_name: user.first_name,
        last_name: user.last_name,
        language_code: user.language_code,
        last_active_at: new Date().toISOString(),
      });
      return updated!;
    }

    return this.create(user);
  }

  async updateLastActive(telegramId: number): Promise<void> {
    await supabase
      .from("users")
      .update({ last_active_at: new Date().toISOString() })
      .eq("telegram_id", telegramId);
  }
}

export const userService = new UserService();
