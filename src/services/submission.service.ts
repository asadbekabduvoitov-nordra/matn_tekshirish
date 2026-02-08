import { supabase } from "../lib/supabase.js";
import { createChildLogger } from "../lib/logger.js";
import type { Tables, TablesInsert } from "../types/index.js";
import type { CollectedMessage } from "../types/context.js";

const logger = createChildLogger("submission-service");

export class SubmissionService {
  async create(
    userTelegramId: number,
    userFirstName: string,
    groupMessageId: number,
    messages: CollectedMessage[]
  ): Promise<Tables<"submissions">> {
    const { data, error } = await supabase
      .from("submissions")
      .insert({
        user_telegram_id: userTelegramId,
        user_first_name: userFirstName,
        group_message_id: groupMessageId,
        messages: JSON.stringify(messages),
        status: "PENDING",
      })
      .select()
      .single();

    if (error) {
      logger.error({ error, userTelegramId }, "Failed to create submission");
      throw error;
    }

    logger.info({ submissionId: data.id, userTelegramId }, "Submission created");
    return data;
  }

  async findByGroupMessageId(
    groupMessageId: number
  ): Promise<Tables<"submissions"> | null> {
    const { data, error } = await supabase
      .from("submissions")
      .select("*")
      .eq("group_message_id", groupMessageId)
      .single();

    if (error && error.code !== "PGRST116") {
      logger.error({ error, groupMessageId }, "Failed to find submission");
      throw error;
    }

    return data;
  }

  async findById(id: string): Promise<Tables<"submissions"> | null> {
    const { data, error } = await supabase
      .from("submissions")
      .select("*")
      .eq("id", id)
      .single();

    if (error && error.code !== "PGRST116") {
      logger.error({ error, id }, "Failed to find submission");
      throw error;
    }

    return data;
  }

  async markAsAnswered(
    submissionId: string,
    answeredByTelegramId: number
  ): Promise<Tables<"submissions"> | null> {
    const { data, error } = await supabase
      .from("submissions")
      .update({
        status: "ANSWERED",
        answered_at: new Date().toISOString(),
        answered_by_telegram_id: answeredByTelegramId,
      })
      .eq("id", submissionId)
      .select()
      .single();

    if (error) {
      logger.error({ error, submissionId }, "Failed to mark submission as answered");
      throw error;
    }

    logger.info({ submissionId, answeredByTelegramId }, "Submission marked as answered");
    return data;
  }

  async isPending(submissionId: string): Promise<boolean> {
    const submission = await this.findById(submissionId);
    return submission?.status === "PENDING";
  }
}

export const submissionService = new SubmissionService();
