import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import Ionicons from "@expo/vector-icons/Ionicons";
import JobsScreen from "../screens/JobsScreen";
import ProfileScreen from "../screens/ProfileScreen";
import BrowseJobsScreen from "../screens/BrowseJobsScreen";
import WorkersListScreen from "../screens/WorkersListScreen";
import MyApplicationsScreen from "../screens/MyApplicationsScreen";
import BookingsScreen from "../screens/BookingsScreen";
import ServicesHubScreen from "../screens/ServicesHubScreen";

import { useAuth } from "../context/AuthContext";
import { Colors, FontSize, FontWeight } from "../theme";

const Tab = createBottomTabNavigator();

const ICONS = {
  Jobs: { active: "briefcase", inactive: "briefcase-outline" },
  Browse: { active: "search", inactive: "search-outline" },
  Workers: { active: "people", inactive: "people-outline" },
  Applications: { active: "document-text", inactive: "document-text-outline" },
  Bookings: { active: "calendar", inactive: "calendar-outline" },
  Hub: { active: "apps", inactive: "apps-outline" },
  Profile: { active: "person", inactive: "person-outline" },
};

export default function AuthenticatedTabs() {
  const { user } = useAuth();
  const role = user?.role || "customer";

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: true,
        headerStyle: {
          backgroundColor: Colors.background,
          borderBottomWidth: 1,
          borderBottomColor: Colors.divider,
          shadowColor: "transparent",
          elevation: 0,
        },
        headerTitleStyle: {
          color: Colors.textPrimary,
          fontSize: FontSize.lg,
          fontWeight: FontWeight.bold,
        },
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.textMuted,
        tabBarShowLabel: false, // Prevents collisions
        tabBarStyle: {
          backgroundColor: Colors.surfaceCard,
          borderTopWidth: 1,
          borderTopColor: Colors.divider,
          height: 80, // Modern taller height
          paddingBottom: 20,
          paddingTop: 12,
        },
        tabBarIcon: ({ color, size, focused }) => (
          <Ionicons
            name={focused ? ICONS[route.name].active : ICONS[route.name].inactive}
            size={28} // Slightly larger for clarity
            color={color}
          />
        ),
      })}
    >
      {role === "customer" && (
        <>
          <Tab.Screen name="Jobs" component={JobsScreen} options={{ title: "My Jobs" }} />
          <Tab.Screen name="Workers" component={WorkersListScreen} />
          <Tab.Screen name="Bookings" component={BookingsScreen} />
        </>
      )}

      {role === "worker" && (
        <>
          <Tab.Screen name="Browse" component={BrowseJobsScreen} options={{ title: "Browse Jobs" }} />
          <Tab.Screen name="Applications" component={MyApplicationsScreen} />
          <Tab.Screen name="Bookings" component={BookingsScreen} />
        </>
      )}

      {role === "supplier" && (
        <>
          <Tab.Screen name="Jobs" component={JobsScreen} options={{ title: "Equipment Dashboard" }} />
        </>
      )}

      {role === "admin" && (
        <>
          <Tab.Screen name="Jobs" component={JobsScreen} options={{ title: "Admin Console" }} />
        </>
      )}

      <Tab.Screen name="Hub" component={ServicesHubScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}
