import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Image,
} from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { trpc } from "@/lib/trpc";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useMemo, useState } from "react";
import * as Haptics from "expo-haptics";
import { useAuth } from "@/hooks/use-auth";

export default function PostDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const utils = trpc.useUtils();

  const postId = useMemo(() => {
    const n = parseInt(String(id || "0"), 10);
    return Number.isFinite(n) ? n : 0;
  }, [id]);

  const { data: post, isLoading: postLoading } = trpc.community.getPostById.useQuery(
    { postId },
    { enabled: postId > 0 }
  );

  const { data: comments, isLoading: commentsLoading } = trpc.community.getComments.useQuery(
    { postId },
    { enabled: postId > 0 }
  );

  const [commentText, setCommentText] = useState("");

  const createCommentMutation = trpc.community.addComment.useMutation({
    onSuccess: () => {
      utils.community.getComments.invalidate({ postId });
      if (Platform.OS !== "web") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
      setCommentText("");
    },
    onError: (error: any) => {
      Alert.alert("Error", error?.message || "Failed to add comment");
    },
  });

  const deletePostMutation = trpc.community.deletePost.useMutation({
    onSuccess: async () => {
      await utils.community.getPosts.invalidate();
      await utils.community.getPostById.invalidate({ postId });
      router.back();
    },
    onError: (error: any) => {
      Alert.alert("Error", error?.message || "Failed to delete post");
    },
  });

  const handleSubmitComment = () => {
    if (!commentText.trim()) {
      Alert.alert("Empty Comment", "Please write something before posting.");
      return;
    }

    createCommentMutation.mutate({
      postId,
      commentText: commentText.trim(),
    });
  };

  if (postLoading) {
    return (
      <ScreenContainer className="items-center justify-center">
        <ActivityIndicator size="large" />
      </ScreenContainer>
    );
  }

  if (!post) {
    return (
      <ScreenContainer className="items-center justify-center p-6">
        <Text className="text-muted">Post not found</Text>
        <TouchableOpacity onPress={() => router.back()} className="mt-4">
          <Text className="text-primary">← Go Back</Text>
        </TouchableOpacity>
      </ScreenContainer>
    );
  }

  // UI permission only — backend still enforces real rules.
  const postUserId = (post as any)?.userId ?? (post as any)?.user?.id;
  const canDelete =
    !!user &&
    (user.role === "admin" ||
      user.role === "leader" ||
      (postUserId != null && user.id === postUserId));

  const authorName = (post as any)?.authorName || "Member";
  const createdAt = (post as any)?.createdAt || null;
  const formattedDate = createdAt ? new Date(createdAt).toLocaleString() : "";

  const postText = (post as any)?.postText || "";
  const imageUrl = (post as any)?.postImageUrl || undefined;

  const isPinned = Boolean((post as any)?.isPinned);

  return (
    <ScreenContainer className="p-6">
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
      >
        <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
          <View className="flex-1 gap-6">
            {/* Header */}
            <View>
              <TouchableOpacity onPress={() => router.back()} className="mb-4">
                <Text className="text-primary text-base">← Back</Text>
              </TouchableOpacity>
            </View>

            {/* Post Card */}
            <View className="bg-surface rounded-2xl p-4 border border-border">
              {/* Header Row */}
              <View className="flex-row items-center mb-3">
                <View className="flex-1">
                  <Text className="text-base font-bold text-foreground">{authorName}</Text>
                  {!!formattedDate && <Text className="text-xs text-muted">{formattedDate}</Text>}
                </View>

                {isPinned && (
                  <View className="bg-warning/20 px-2 py-1 rounded-full mr-2">
                    <Text className="text-warning text-xs font-semibold">📌 Pinned</Text>
                  </View>
                )}

                {canDelete && (
                  <TouchableOpacity
                onPress={() => {
                // ✅ Web: use window.confirm so the callback actually runs
                if (Platform.OS === "web") {
                const ok = window.confirm("Are you sure you want to delete this post?");
                if (ok) deletePostMutation.mutate({ postId });
                return;
              }

              // ✅ Mobile: use native Alert buttons
              Alert.alert("Delete Post", "Are you sure you want to delete this post?", [
                { text: "Cancel", style: "cancel" },
                {
                  text: "Delete",
                  style: "destructive",
                  onPress: () => deletePostMutation.mutate({ postId }),
                },
              ]);
            }}

                    className="bg-red-100 px-3 py-1 rounded-full"
                  >
                    <Text className="text-red-600 text-xs font-semibold">
                      {deletePostMutation.isPending ? "Deleting..." : "Delete"}
                    </Text>
                  </TouchableOpacity>
                )}
              </View>

              {/* Post Text */}
              {!!postText && (
                <Text className="text-foreground text-base leading-6">{postText}</Text>
              )}

              {/* Image */}
              {!!imageUrl && (
                <Image
                  source={{ uri: imageUrl }}
                  style={{
                    width: "100%",
                    height: 240,
                    borderRadius: 16,
                    marginTop: 12,
                  }}
                  resizeMode="cover"
                />
              )}
            </View>

            {/* Comments */}
            <View className="bg-surface rounded-2xl p-4 border border-border">
              <Text className="text-lg font-semibold text-foreground mb-3">
                Comments ({comments?.length || 0})
              </Text>

              {commentsLoading ? (
                <ActivityIndicator />
              ) : comments && comments.length > 0 ? (
                <View className="gap-3">
                  {comments.map((c: any) => (
                    <View key={c.id} className="bg-background rounded-xl p-3 border border-border">
                      <View className="flex-row items-center justify-between mb-1">
                        <Text className="text-sm font-semibold text-foreground">
                          {c.authorName || "Member"}
                        </Text>
                        <Text className="text-xs text-muted">
                          {c.createdAt ? new Date(c.createdAt).toLocaleDateString() : ""}
                        </Text>
                      </View>
                      <Text className="text-sm text-foreground">{c.commentText}</Text>
                    </View>
                  ))}
                </View>
              ) : (
                <Text className="text-muted">No comments yet.</Text>
              )}

              {/* Add Comment */}
              <View className="mt-4 gap-3">
                <TextInput
                  value={commentText}
                  onChangeText={setCommentText}
                  placeholder="Write a comment..."
                  placeholderTextColor="#9BA1A6"
                  className="text-foreground text-base p-3 bg-background rounded-xl border border-border min-h-[80px]"
                  multiline
                />

                <TouchableOpacity
                  onPress={handleSubmitComment}
                  disabled={createCommentMutation.isPending}
                  className="bg-primary rounded-xl p-3 items-center"
                >
                  {createCommentMutation.isPending ? (
                    <ActivityIndicator color="#ffffff" />
                  ) : (
                    <Text className="text-background font-semibold">Post Comment</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </ScreenContainer>
  );
}
