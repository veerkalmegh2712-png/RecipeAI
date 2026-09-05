import AsyncStorage from "@react-native-async-storage/async-storage";
import { useLocalSearchParams, useRouter } from "expo-router";
import { generateRecipe, type Recipe } from "@/services/gemini";
import { useEffect, useRef, useState } from "react";
import {
    ActivityIndicator,
    FlatList,
    KeyboardAvoidingView,
    Platform,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";

// Recipe type is imported from @/services/gemini

type Message = {
    id: string;
    text?: string;
    sender: "user" | "bot";
    recipe?: Recipe;
};

const HISTORY_KEY = "@recipeai_history";

export default function ChatScreen() {
    const router = useRouter();


    const params = useLocalSearchParams<{
        recipe?: string;
    }>();

    const flatListRef = useRef<FlatList<Message>>(null);

    const [message, setMessage] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    const [messages, setMessages] = useState<Message[]>([
        {
            id: "1",
            sender: "bot",
            text: "Hi! 👋 Tell me what ingredients you have and I'll create a recipe for you.",
        },
    ]);

    // =========================================================
    // OPEN SAVED RECIPE FROM HISTORY
    // =========================================================

    useEffect(() => {
        if (!params.recipe) {
            return;
        }

        try {
            const savedRecipe: Recipe = JSON.parse(
                String(params.recipe)
            );

            setMessages([
                {
                    id: "history-welcome",
                    sender: "bot",
                    text: "Here's your saved recipe. 👨‍🍳",
                },
                {
                    id: `saved-${Date.now()}`,
                    sender: "bot",
                    recipe: savedRecipe,
                },
            ]);
        } catch (error) {
            console.error(
                "ERROR OPENING SAVED RECIPE:",
                error
            );
        }
    }, [params.recipe]);

    // =========================================================
    // AUTO SCROLL
    // =========================================================

    useEffect(() => {
        const timer = setTimeout(() => {
            flatListRef.current?.scrollToEnd({
                animated: true,
            });
        }, 100);

        return () => clearTimeout(timer);
    }, [messages, isLoading]);

    // =========================================================
    // SAVE RECIPE TO HISTORY
    // =========================================================

    const saveRecipeToHistory = async (recipe: Recipe) => {
        try {
            const storedHistory =
                await AsyncStorage.getItem(HISTORY_KEY);

            let history: Recipe[] = [];

            if (storedHistory) {
                try {
                    history = JSON.parse(storedHistory);
                } catch {
                    history = [];
                }
            }

            const updatedHistory = [
                recipe,
                ...history.filter(
                    (item) =>
                        item.recipeName !==
                        recipe.recipeName
                ),
            ].slice(0, 20);

            await AsyncStorage.setItem(
                HISTORY_KEY,
                JSON.stringify(updatedHistory)
            );

            console.log(
                "RECIPE SAVED TO HISTORY SUCCESSFULLY"
            );
        } catch (error) {
            console.error(
                "ERROR SAVING RECIPE TO HISTORY:",
                error
            );
        }
    };

    // =========================================================
    // SEND MESSAGE TO DJANGO
    // =========================================================

    const sendMessage = async () => {
        if (!message.trim() || isLoading) {
            return;
        }

        const userMessage = message.trim();

        const newMessage: Message = {
            id: Date.now().toString(),
            text: userMessage,
            sender: "user",
        };

        setMessages((previousMessages) => [
            ...previousMessages,
            newMessage,
        ]);

        setMessage("");
        setIsLoading(true);

        try {
            console.log("=================================");
            console.log("CALLING GEMINI API...");
            console.log("USER MESSAGE:", userMessage);
            console.log("=================================");

            const recipe = await generateRecipe(userMessage);

            console.log("FINAL RECIPE OBJECT:");
            console.log(recipe);

            // Save complete recipe to history
            await saveRecipeToHistory(recipe);

            const botMessage: Message = {
                id: (Date.now() + 1).toString(),
                sender: "bot",
                recipe: recipe,
            };

            setMessages((previousMessages) => [
                ...previousMessages,
                botMessage,
            ]);

            console.log(
                "RECIPE ADDED TO CHAT SUCCESSFULLY"
            );
        } catch (error) {
            console.error(
                "================================="
            );
            console.error(
                "RECIPE ERROR:"
            );
            console.error(error);
            console.error(
                "================================="
            );

            const errorMessage: Message = {
                id: (Date.now() + 1).toString(),
                sender: "bot",
                text:
                    "Sorry, I couldn't generate the recipe right now. Please check your connection and try again.",
            };

            setMessages((previousMessages) => [
                ...previousMessages,
                errorMessage,
            ]);
        } finally {
            setIsLoading(false);
        }
    };

    // =========================================================
    // RECIPE CARD
    // =========================================================

    const renderRecipeCard = (recipe: Recipe) => {
        return (
            <View style={styles.recipeCard}>

                {/* Recipe Header */}

                <View style={styles.recipeHeader}>
                    <View
                        style={
                            styles.recipeIconContainer
                        }
                    >
                        <Text style={styles.recipeEmoji}>
                            🍳
                        </Text>
                    </View>

                    <View
                        style={
                            styles.recipeHeaderText
                        }
                    >
                        <Text
                            style={styles.recipeName}
                        >
                            {recipe.recipeName}
                        </Text>

                        <Text
                            style={
                                styles.recipeDescription
                            }
                        >
                            {recipe.description}
                        </Text>
                    </View>
                </View>

                {/* Recipe Information */}

                <View style={styles.infoRow}>

                    <View style={styles.infoBox}>
                        <Text
                            style={styles.infoEmoji}
                        >
                            ⏱️
                        </Text>

                        <Text
                            style={styles.infoLabel}
                        >
                            TIME
                        </Text>

                        <Text
                            style={styles.infoValue}
                        >
                            {recipe.cookingTime}
                        </Text>
                    </View>

                    <View style={styles.infoBox}>
                        <Text
                            style={styles.infoEmoji}
                        >
                            📊
                        </Text>

                        <Text
                            style={styles.infoLabel}
                        >
                            DIFFICULTY
                        </Text>

                        <Text
                            style={styles.infoValue}
                        >
                            {recipe.difficulty}
                        </Text>
                    </View>

                    <View style={styles.infoBox}>
                        <Text
                            style={styles.infoEmoji}
                        >
                            👥
                        </Text>

                        <Text
                            style={styles.infoLabel}
                        >
                            SERVINGS
                        </Text>

                        <Text
                            style={styles.infoValue}
                        >
                            {recipe.servings}
                        </Text>
                    </View>

                </View>

                {/* Ingredients */}

                <View style={styles.section}>
                    <Text
                        style={styles.sectionTitle}
                    >
                        🥕 Ingredients
                    </Text>

                    {recipe.ingredients.length > 0 ? (
                        recipe.ingredients.map(
                            (ingredient, index) => (
                                <View
                                    key={`ingredient-${index}`}
                                    style={
                                        styles.ingredientRow
                                    }
                                >
                                    <View
                                        style={
                                            styles.bullet
                                        }
                                    />

                                    <Text
                                        style={
                                            styles.ingredientText
                                        }
                                    >
                                        {ingredient}
                                    </Text>
                                </View>
                            )
                        )
                    ) : (
                        <Text
                            style={styles.emptyText}
                        >
                            No ingredients provided.
                        </Text>
                    )}
                </View>

                {/* Instructions */}

                <View style={styles.section}>
                    <Text
                        style={styles.sectionTitle}
                    >
                        👨‍🍳 Instructions
                    </Text>

                    {recipe.steps.length > 0 ? (
                        recipe.steps.map(
                            (step, index) => (
                                <View
                                    key={`step-${index}`}
                                    style={
                                        styles.stepRow
                                    }
                                >
                                    <View
                                        style={
                                            styles.stepNumber
                                        }
                                    >
                                        <Text
                                            style={
                                                styles.stepNumberText
                                            }
                                        >
                                            {index + 1}
                                        </Text>
                                    </View>

                                    <Text
                                        style={
                                            styles.stepText
                                        }
                                    >
                                        {step}
                                    </Text>
                                </View>
                            )
                        )
                    ) : (
                        <Text
                            style={styles.emptyText}
                        >
                            No instructions provided.
                        </Text>
                    )}
                </View>

                {/* Tips */}

                {recipe.tips &&
                    recipe.tips.length > 0 && (
                        <View style={styles.tipsBox}>
                            <Text
                                style={styles.tipsTitle}
                            >
                                💡 Chef's Tips
                            </Text>

                            {recipe.tips.map(
                                (tip, index) => (
                                    <Text
                                        key={`tip-${index}`}
                                        style={
                                            styles.tipText
                                        }
                                    >
                                        • {tip}
                                    </Text>
                                )
                            )}
                        </View>
                    )}
            </View>
        );
    };

    // =========================================================
    // QUICK SUGGESTIONS
    // =========================================================

    const suggestions = [
        {
            text: "🍛 Indian",
            value: "Give me an Indian recipe",
        },
        {
            text: "🥗 Healthy",
            value: "Give me a healthy recipe",
        },
        {
            text: "⚡ Quick",
            value:
                "Give me a recipe that takes less than 20 minutes",
        },
        {
            text: "💰 Budget",
            value: "Give me a budget-friendly recipe",
        },
    ];

    // =========================================================
    // UI
    // =========================================================

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={
                Platform.OS === "ios"
                    ? "padding"
                    : "height"
            }
            keyboardVerticalOffset={
                Platform.OS === "ios" ? 0 : 0
            }
        >

            {/* HEADER */}

            <View style={styles.header}>

                <View>
                    <Text
                        style={styles.headerTitle}
                    >
                        🍳 RecipeAI
                    </Text>

                    <Text
                        style={styles.headerSubtitle}
                    >
                        Your personal cooking assistant
                    </Text>
                </View>

                {/* HISTORY BUTTON */}

                <TouchableOpacity
                    style={styles.historyButton}
                    onPress={() =>
                        router.push(
                            "/(tabs)/history"
                        )
                    }
                    activeOpacity={0.75}
                >
                    <View
                        style={styles.historyLine}
                    />
                    <View
                        style={styles.historyLine}
                    />
                </TouchableOpacity>

            </View>

            {/* SUGGESTIONS */}

            <View
                style={styles.suggestionsContainer}
            >
                <Text
                    style={styles.suggestionsTitle}
                >
                    What are you cooking today?
                </Text>

                <FlatList
                    horizontal
                    showsHorizontalScrollIndicator={
                        false
                    }
                    data={suggestions}
                    keyExtractor={(item) =>
                        item.text
                    }
                    keyboardShouldPersistTaps="handled"
                    renderItem={({ item }) => (
                        <TouchableOpacity
                            style={
                                styles.suggestionButton
                            }
                            onPress={() =>
                                setMessage(
                                    item.value
                                )
                            }
                            disabled={isLoading}
                        >
                            <Text
                                style={
                                    styles.suggestionText
                                }
                            >
                                {item.text}
                            </Text>
                        </TouchableOpacity>
                    )}
                />
            </View>

            {/* CHAT */}

            <FlatList
                ref={flatListRef}
                data={messages}
                keyExtractor={(item) => item.id}
                style={styles.messagesList}
                contentContainerStyle={
                    styles.messagesContainer
                }
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
                keyboardDismissMode="interactive"
                renderItem={({ item }) => (
                    <View
                        style={
                            item.sender === "user"
                                ? styles.userMessageContainer
                                : styles.botMessageContainer
                        }
                    >
                        {item.sender === "user" ? (
                            <View
                                style={
                                    styles.userBubble
                                }
                            >
                                <Text
                                    style={
                                        styles.userText
                                    }
                                >
                                    {item.text}
                                </Text>
                            </View>
                        ) : item.recipe ? (
                            renderRecipeCard(
                                item.recipe
                            )
                        ) : (
                            <View
                                style={
                                    styles.botBubble
                                }
                            >
                                <Text
                                    style={
                                        styles.botText
                                    }
                                >
                                    {item.text}
                                </Text>
                            </View>
                        )}
                    </View>
                )}
            />

            {/* LOADING */}

            {isLoading && (
                <View
                    style={styles.loadingContainer}
                >
                    <ActivityIndicator
                        size="small"
                        color="#FF7043"
                    />

                    <Text
                        style={styles.loadingText}
                    >
                        RecipeAI is creating your
                        recipe...
                    </Text>
                </View>
            )}

            {/* INPUT */}

            <View
                style={styles.inputContainer}
            >
                <TextInput
                    style={styles.input}
                    placeholder="Ask for a recipe..."
                    placeholderTextColor="#999999"
                    value={message}
                    onChangeText={setMessage}
                    onSubmitEditing={sendMessage}
                    editable={!isLoading}
                    returnKeyType="send"
                    multiline={false}
                    blurOnSubmit={false}
                />

                <TouchableOpacity
                    style={[
                        styles.sendButton,
                        isLoading &&
                        styles.sendButtonDisabled,
                    ]}
                    onPress={sendMessage}
                    disabled={isLoading}
                    activeOpacity={0.8}
                >
                    {isLoading ? (
                        <ActivityIndicator
                            size="small"
                            color="#FFFFFF"
                        />
                    ) : (
                        <Text
                            style={
                                styles.sendButtonText
                            }
                        >
                            ➤
                        </Text>
                    )}
                </TouchableOpacity>
            </View>

        </KeyboardAvoidingView>
    );

}

// =========================================================
// STYLES
// =========================================================

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#FFF8F3",
    },
    header: {
        paddingTop: 55,
        paddingBottom: 16,
        paddingHorizontal: 20,
        backgroundColor: "#FFFFFF",
        borderBottomWidth: 1,
        borderBottomColor: "#EEEEEE",
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
    },

    headerTitle: {
        fontSize: 24,
        fontWeight: "700",
        color: "#2D2D2D",
    },

    headerSubtitle: {
        marginTop: 3,
        fontSize: 13,
        color: "#888888",
    },

    historyButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: "#FFF0EA",
        alignItems: "center",
        justifyContent: "center",
    },

    historyLine: {
        width: 21,
        height: 3,
        borderRadius: 2,
        backgroundColor: "#FF7043",
        marginVertical: 3,
    },

    suggestionsContainer: {
        paddingTop: 14,
        paddingBottom: 12,
        backgroundColor: "#FFF8F3",
    },

    suggestionsTitle: {
        fontSize: 15,
        fontWeight: "600",
        color: "#444444",
        marginBottom: 10,
        paddingHorizontal: 16,
    },

    suggestionButton: {
        backgroundColor: "#FFFFFF",
        borderWidth: 1,
        borderColor: "#FFE0D5",
        borderRadius: 20,
        paddingVertical: 9,
        paddingHorizontal: 14,
        marginLeft: 8,
    },

    suggestionText: {
        color: "#555555",
        fontSize: 13,
        fontWeight: "500",
    },

    messagesList: {
        flex: 1,
    },

    messagesContainer: {
        padding: 14,
        paddingBottom: 20,
    },

    userMessageContainer: {
        alignItems: "flex-end",
        marginBottom: 12,
        width: "100%",
    },

    botMessageContainer: {
        alignItems: "flex-start",
        marginBottom: 14,
        width: "100%",
    },

    userBubble: {
        backgroundColor: "#FF7043",
        paddingHorizontal: 15,
        paddingVertical: 11,
        borderRadius: 17,
        borderBottomRightRadius: 4,
        maxWidth: "82%",
    },

    userText: {
        color: "#FFFFFF",
        fontSize: 15,
        lineHeight: 21,
    },

    botBubble: {
        backgroundColor: "#FFFFFF",
        paddingHorizontal: 15,
        paddingVertical: 12,
        borderRadius: 17,
        borderBottomLeftRadius: 4,
        maxWidth: "85%",
        borderWidth: 1,
        borderColor: "#F0F0F0",
    },

    botText: {
        color: "#333333",
        fontSize: 15,
        lineHeight: 21,
    },

    recipeCard: {
        width: "100%",
        backgroundColor: "#FFFFFF",
        borderRadius: 20,
        padding: 16,
        borderWidth: 1,
        borderColor: "#EEEEEE",
        marginBottom: 4,
    },

    recipeHeader: {
        flexDirection: "row",
        marginBottom: 16,
    },

    recipeIconContainer: {
        width: 52,
        height: 52,
        borderRadius: 26,
        backgroundColor: "#FFF0EA",
        alignItems: "center",
        justifyContent: "center",
        marginRight: 11,
    },

    recipeEmoji: {
        fontSize: 29,
    },

    recipeHeaderText: {
        flex: 1,
    },

    recipeName: {
        fontSize: 21,
        fontWeight: "800",
        color: "#2D2D2D",
        lineHeight: 27,
    },

    recipeDescription: {
        marginTop: 5,
        fontSize: 13,
        lineHeight: 19,
        color: "#777777",
    },

    infoRow: {
        flexDirection: "row",
        marginBottom: 18,
    },

    infoBox: {
        flex: 1,
        backgroundColor: "#FFF8F3",
        borderRadius: 12,
        paddingVertical: 10,
        alignItems: "center",
        marginHorizontal: 3,
    },

    infoEmoji: {
        fontSize: 18,
        marginBottom: 3,
    },

    infoLabel: {
        fontSize: 8,
        fontWeight: "700",
        color: "#999999",
        letterSpacing: 0.5,
    },

    infoValue: {
        marginTop: 2,
        fontSize: 11,
        fontWeight: "700",
        color: "#444444",
        textAlign: "center",
    },

    section: {
        marginBottom: 18,
    },

    sectionTitle: {
        fontSize: 17,
        fontWeight: "800",
        color: "#2D2D2D",
        marginBottom: 10,
    },

    ingredientRow: {
        flexDirection: "row",
        alignItems: "flex-start",
        marginBottom: 8,
    },

    bullet: {
        width: 7,
        height: 7,
        borderRadius: 4,
        backgroundColor: "#FF7043",
        marginTop: 7,
        marginRight: 10,
    },

    ingredientText: {
        flex: 1,
        fontSize: 14,
        lineHeight: 20,
        color: "#555555",
    },

    stepRow: {
        flexDirection: "row",
        alignItems: "flex-start",
        marginBottom: 12,
    },

    stepNumber: {
        width: 28,
        height: 28,
        borderRadius: 14,
        backgroundColor: "#FF7043",
        alignItems: "center",
        justifyContent: "center",
        marginRight: 10,
    },

    stepNumberText: {
        color: "#FFFFFF",
        fontSize: 13,
        fontWeight: "800",
    },

    stepText: {
        flex: 1,
        fontSize: 14,
        lineHeight: 20,
        color: "#555555",
        paddingTop: 3,
    },

    tipsBox: {
        backgroundColor: "#FFF8E1",
        borderRadius: 14,
        padding: 13,
        marginTop: 2,
    },

    tipsTitle: {
        fontSize: 15,
        fontWeight: "800",
        color: "#5D4037",
        marginBottom: 7,
    },

    tipText: {
        fontSize: 13,
        lineHeight: 19,
        color: "#6D4C41",
        marginBottom: 3,
    },

    emptyText: {
        fontSize: 13,
        color: "#999999",
        fontStyle: "italic",
    },

    loadingContainer: {
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 16,
        paddingVertical: 9,
        backgroundColor: "#FFFFFF",
        borderTopWidth: 1,
        borderTopColor: "#EEEEEE",
    },

    loadingText: {
        marginLeft: 9,
        fontSize: 13,
        color: "#777777",
        fontStyle: "italic",
    },

    inputContainer: {
        flexDirection: "row",
        alignItems: "center",
        padding: 12,
        paddingBottom: 12,
        backgroundColor: "#FFFFFF",
        borderTopWidth: 1,
        borderTopColor: "#EEEEEE",
    },

    input: {
        flex: 1,
        height: 48,
        paddingHorizontal: 16,
        borderRadius: 24,
        backgroundColor: "#F4F4F4",
        fontSize: 15,
        color: "#333333",
    },

    sendButton: {
        width: 48,
        height: 48,
        marginLeft: 8,
        borderRadius: 24,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#FF7043",
    },

    sendButtonDisabled: {
        opacity: 0.6,
    },

    sendButtonText: {
        color: "#FFFFFF",
        fontSize: 20,
        fontWeight: "bold",
    },


});