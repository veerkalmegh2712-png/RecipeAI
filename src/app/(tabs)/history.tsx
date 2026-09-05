
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import {
    Alert,
    FlatList,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const HISTORY_KEY = "@recipeai_history";

type Recipe = {
    recipeName: string;
    cookingTime: string;
    difficulty: string;
    servings: string;
    description: string;
    ingredients: string[];
    steps: string[];
    tips: string[];
};

export default function HistoryScreen() {
    const router = useRouter();

    const [recipes, setRecipes] = useState<Recipe[]>([]);
    const [loading, setLoading] = useState(true);

    const loadHistory = async () => {
        try {
            setLoading(true);

            const storedHistory =
                await AsyncStorage.getItem(HISTORY_KEY);

            if (storedHistory) {
                const history: Recipe[] =
                    JSON.parse(storedHistory);

                setRecipes(history);
            } else {
                setRecipes([]);
            }
        } catch (error) {
            console.error("ERROR LOADING HISTORY:", error);
        } finally {
            setLoading(false);
        }
    };

    useFocusEffect(
        useCallback(() => {
            loadHistory();
        }, [])
    );

    const deleteRecipe = (recipeName: string) => {
        Alert.alert(
            "Delete Recipe",
            `Remove "${recipeName}" from history?`,
            [
                {
                    text: "Cancel",
                    style: "cancel",
                },
                {
                    text: "Delete",
                    style: "destructive",
                    onPress: async () => {
                        try {
                            const updatedHistory =
                                recipes.filter(
                                    (recipe) =>
                                        recipe.recipeName !==
                                        recipeName
                                );

                            await AsyncStorage.setItem(
                                HISTORY_KEY,
                                JSON.stringify(updatedHistory)
                            );

                            setRecipes(updatedHistory);
                        } catch (error) {
                            console.error(
                                "ERROR DELETING RECIPE:",
                                error
                            );
                        }
                    },
                },
            ]
        );
    };

    const clearHistory = () => {
        if (recipes.length === 0) {
            return;
        }

        Alert.alert(
            "Clear History",
            "Are you sure you want to delete all saved recipes?",
            [
                {
                    text: "Cancel",
                    style: "cancel",
                },
                {
                    text: "Clear All",
                    style: "destructive",
                    onPress: async () => {
                        try {
                            await AsyncStorage.removeItem(
                                HISTORY_KEY
                            );

                            setRecipes([]);
                        } catch (error) {
                            console.error(
                                "ERROR CLEARING HISTORY:",
                                error
                            );
                        }
                    },
                },
            ]
        );
    };

    const openRecipe = (recipe: Recipe) => {
        router.push({
            pathname: "/chat",
            params: {
                recipe: JSON.stringify(recipe),
            },
        });
    };

    const renderRecipe = ({
        item,
    }: {
        item: Recipe;
    }) => (
        <TouchableOpacity
            style={styles.card}
            activeOpacity={0.85}
            onPress={() => openRecipe(item)}
        >
            <View style={styles.cardTop}>
                <View style={styles.iconContainer}>
                    <Text style={styles.icon}>🍳</Text>
                </View>

                <TouchableOpacity
                    style={styles.deleteButton}
                    onPress={() =>
                        deleteRecipe(item.recipeName)
                    }
                >
                    <Text style={styles.deleteText}>✕</Text>
                </TouchableOpacity>
            </View>

            <Text style={styles.recipeName}>
                {item.recipeName}
            </Text>

            <Text
                style={styles.description}
                numberOfLines={2}
            >
                {item.description}
            </Text>

            <View style={styles.infoRow}>
                <View style={styles.infoItem}>
                    <Text style={styles.infoIcon}>⏱</Text>
                    <Text style={styles.infoText}>
                        {item.cookingTime}
                    </Text>
                </View>

                <View style={styles.infoItem}>
                    <Text style={styles.infoIcon}>👥</Text>
                    <Text style={styles.infoText}>
                        {item.servings}
                    </Text>
                </View>

                <View style={styles.difficultyBadge}>
                    <Text style={styles.difficultyText}>
                        {item.difficulty}
                    </Text>
                </View>
            </View>

            <Text style={styles.openText}>
                Tap to view recipe →
            </Text>
        </TouchableOpacity>
    );

    if (loading) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.center}>
                    <Text style={styles.loadingText}>
                        Loading history...
                    </Text>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <View>
                    <Text style={styles.title}>
                        Recipe History
                    </Text>
                    <Text style={styles.subtitle}>
                        Your saved recipes
                    </Text>
                </View>

                {recipes.length > 0 && (
                    <TouchableOpacity
                        onPress={clearHistory}
                        style={styles.clearButton}
                    >
                        <Text style={styles.clearButtonText}>
                            Clear All
                        </Text>
                    </TouchableOpacity>
                )}
            </View>

            {recipes.length === 0 ? (
                <View style={styles.emptyContainer}>
                    <Text style={styles.emptyIcon}>📖</Text>

                    <Text style={styles.emptyTitle}>
                        No Saved Recipes
                    </Text>

                    <Text style={styles.emptyText}>
                        Recipes you generate will appear here
                        automatically.
                    </Text>

                    <TouchableOpacity
                        style={styles.startButton}
                        onPress={() => router.push("/chat")}
                    >
                        <Text style={styles.startButtonText}>
                            Generate a Recipe
                        </Text>
                    </TouchableOpacity>
                </View>
            ) : (
                <FlatList
                    data={recipes}
                    keyExtractor={(item, index) =>
                        `${item.recipeName}-${index}`
                    }
                    renderItem={renderRecipe}
                    contentContainerStyle={styles.list}
                    showsVerticalScrollIndicator={false}
                />
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#F8FAFC",
    },

    center: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
    },

    loadingText: {
        fontSize: 16,
        color: "#64748B",
    },

    header: {
        paddingHorizontal: 20,
        paddingTop: 20,
        paddingBottom: 16,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
    },

    title: {
        fontSize: 28,
        fontWeight: "800",
        color: "#0F172A",
    },

    subtitle: {
        marginTop: 4,
        fontSize: 14,
        color: "#64748B",
    },

    clearButton: {
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 10,
        backgroundColor: "#FEE2E2",
    },

    clearButtonText: {
        color: "#DC2626",
        fontWeight: "700",
        fontSize: 13,
    },

    list: {
        paddingHorizontal: 16,
        paddingBottom: 30,
    },

    card: {
        backgroundColor: "#FFFFFF",
        borderRadius: 18,
        padding: 18,
        marginBottom: 14,
        borderWidth: 1,
        borderColor: "#E2E8F0",
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.06,
        shadowRadius: 6,
        elevation: 2,
    },

    cardTop: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
    },

    iconContainer: {
        width: 46,
        height: 46,
        borderRadius: 14,
        backgroundColor: "#FFF7ED",
        alignItems: "center",
        justifyContent: "center",
    },

    icon: {
        fontSize: 23,
    },

    deleteButton: {
        width: 34,
        height: 34,
        borderRadius: 17,
        backgroundColor: "#F8FAFC",
        alignItems: "center",
        justifyContent: "center",
    },

    deleteText: {
        color: "#94A3B8",
        fontSize: 16,
        fontWeight: "700",
    },

    recipeName: {
        marginTop: 14,
        fontSize: 19,
        fontWeight: "800",
        color: "#0F172A",
    },

    description: {
        marginTop: 7,
        fontSize: 14,
        lineHeight: 21,
        color: "#64748B",
    },

    infoRow: {
        flexDirection: "row",
        alignItems: "center",
        marginTop: 14,
        gap: 12,
    },

    infoItem: {
        flexDirection: "row",
        alignItems: "center",
    },

    infoIcon: {
        fontSize: 14,
        marginRight: 4,
    },

    infoText: {
        fontSize: 12,
        color: "#475569",
        fontWeight: "600",
    },

    difficultyBadge: {
        paddingHorizontal: 9,
        paddingVertical: 5,
        borderRadius: 8,
        backgroundColor: "#DCFCE7",
    },

    difficultyText: {
        fontSize: 11,
        fontWeight: "700",
        color: "#15803D",
    },

    openText: {
        marginTop: 15,
        fontSize: 13,
        color: "#2563EB",
        fontWeight: "700",
    },

    emptyContainer: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        paddingHorizontal: 35,
    },

    emptyIcon: {
        fontSize: 58,
        marginBottom: 18,
    },

    emptyTitle: {
        fontSize: 23,
        fontWeight: "800",
        color: "#0F172A",
    },

    emptyText: {
        marginTop: 8,
        fontSize: 15,
        lineHeight: 22,
        color: "#64748B",
        textAlign: "center",
    },

    startButton: {
        marginTop: 24,
        paddingHorizontal: 22,
        paddingVertical: 13,
        borderRadius: 12,
        backgroundColor: "#2563EB",
    },

    startButtonText: {
        color: "#FFFFFF",
        fontSize: 14,
        fontWeight: "700",
    },
});