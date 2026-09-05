import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { router } from "expo-router";

export default function HomeScreen() {
  return (<View style={styles.container}>


    {/* Logo */}
    <Text style={styles.logo}>🍳</Text>

    {/* App Name */}
    <Text style={styles.title}>
      RecipeAI
    </Text>

    {/* Description */}
    <Text style={styles.subtitle}>
      Your personal AI cooking assistant
    </Text>

    {/* Start Cooking */}
    <TouchableOpacity
      style={styles.button}
      activeOpacity={0.8}
      onPress={() => router.push("/chat")}
    >
      <Text style={styles.buttonText}>
        Start Cooking 👨‍🍳
      </Text>
    </TouchableOpacity>

  </View>


  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
    backgroundColor: "#FFF8F3",
  },

  logo: {
    fontSize: 80,
    marginBottom: 20,
  },

  title: {
    fontSize: 40,
    fontWeight: "700",
    color: "#2D2D2D",
  },

  subtitle: {
    marginTop: 12,
    fontSize: 17,
    color: "#777777",
    textAlign: "center",
    lineHeight: 25,
  },

  button: {
    marginTop: 40,
    backgroundColor: "#FF7043",
    paddingVertical: 16,
    paddingHorizontal: 35,
    borderRadius: 14,


    shadowColor: "#000000",
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.15,
    shadowRadius: 5,

    elevation: 4,


  },

  buttonText: {
    color: "#FFFFFF",
    fontSize: 17,
    fontWeight: "600",
  },
});
