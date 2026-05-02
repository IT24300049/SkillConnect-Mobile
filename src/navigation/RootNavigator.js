import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { ActivityIndicator, StyleSheet, View } from "react-native";
import { useAuth } from "../context/AuthContext";
import AuthenticatedTabs from "./AuthenticatedTabs";
import WelcomeScreen from "../screens/WelcomeScreen";
import LoginScreen from "../screens/LoginScreen";
import RegisterScreen from "../screens/RegisterScreen";

import BrowseJobsScreen from "../screens/BrowseJobsScreen";
import JobDetailScreen from "../screens/JobDetailScreen";
import WorkersListScreen from "../screens/WorkersListScreen";
import WorkerProfileScreen from "../screens/WorkerProfileScreen";
import BookingDetailScreen from "../screens/BookingDetailScreen";
import CreateBookingScreen from "../screens/CreateBookingScreen";
import MyApplicationsScreen from "../screens/MyApplicationsScreen";
import AdminComplaintsScreen from "../screens/AdminComplaintsScreen";
import RentEquipmentScreen from "../screens/RentEquipmentScreen";
import EquipmentScreen from "../screens/EquipmentScreen";
import MyRentalsScreen from "../screens/MyRentalsScreen";
import SupplierRentalsScreen from "../screens/SupplierRentalsScreen";
import ComplaintsScreen from "../screens/ComplaintsScreen";
import ReviewsScreen from "../screens/ReviewsScreen";
import AdminUserManagementScreen from "../screens/AdminUserManagementScreen";
import EditProfileScreen from "../screens/EditProfileScreen";

const Stack = createNativeStackNavigator();
const AppStack = createNativeStackNavigator();

function SplashScreen() {
  return (
    <View style={styles.centered}>
      <ActivityIndicator size="large" color="#2d7ef7" />
    </View>
  );
}

function AppNavigator() {
  const { user } = useAuth();
  const role = user?.role || "customer";

  return (
    <AppStack.Navigator screenOptions={{ headerShown: true }}>
      <AppStack.Screen name="MainTabs" component={AuthenticatedTabs} options={{ headerShown: false }} />
      <AppStack.Group screenOptions={{ presentation: "card" }}>
        <AppStack.Screen name="BrowseJobs" component={BrowseJobsScreen} />
        <AppStack.Screen name="JobDetail" component={JobDetailScreen} />
        <AppStack.Screen name="WorkersList" component={WorkersListScreen} />
        <AppStack.Screen name="WorkerProfile" component={WorkerProfileScreen} />
        <AppStack.Screen name="BookingDetail" component={BookingDetailScreen} />
        <AppStack.Screen name="CreateBooking" component={CreateBookingScreen} />
        <AppStack.Screen name="MyApplications" component={MyApplicationsScreen} />
        <AppStack.Screen name="AdminComplaints" component={AdminComplaintsScreen} />
        <AppStack.Screen name="RentEquipment" component={RentEquipmentScreen} />
        
        {/* Hub Screens */}
        <AppStack.Screen name="Equipment" component={EquipmentScreen} />
        <AppStack.Screen 
          name="Rentals" 
          component={role === "supplier" ? SupplierRentalsScreen : MyRentalsScreen} 
        />
        <AppStack.Screen name="Complaints" component={ComplaintsScreen} />
        <AppStack.Screen name="Reviews" component={ReviewsScreen} />
        <AppStack.Screen name="AdminUserManagement" component={AdminUserManagementScreen} options={{ title: "User Management" }} />
        <AppStack.Screen name="EditProfile" component={EditProfileScreen} options={{ title: "Edit Profile", headerShown: false }} />
      </AppStack.Group>
    </AppStack.Navigator>
  );
}

export default function RootNavigator() {
  const { token, loading } = useAuth();

  if (loading) {
    return <SplashScreen />;
  }

  return (
    <NavigationContainer>
      {!token ? (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          <Stack.Screen name="Welcome" component={WelcomeScreen} />
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="Register" component={RegisterScreen} />
        </Stack.Navigator>
      ) : (
        <AppNavigator />
      )}
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
  },
});
