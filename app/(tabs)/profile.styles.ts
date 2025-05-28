import { StyleSheet, Platform } from 'react-native';

export const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: { // For ThemedView
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1, // Allows content to take space but still scroll if needed
  },
  scrollContentContainer: {
    paddingBottom: 40, // Space at the bottom
  },
  headerSection: {
    alignItems: 'center',
    paddingVertical: 30,
    // backgroundColor might be a slightly different shade from theme background for emphasis
  },
  profileImage: {
    width: 120,
    height: 120,
    borderRadius: 60, // Makes it circular
    marginBottom: 15,
    borderWidth: 3,
    // borderColor will be themed
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    // color will be themed
  },
  userEmail: {
    fontSize: 16,
    marginTop: 4,
    // color will be themed (perhaps a bit muted)
  },
  infoSection: {
    paddingHorizontal: 20,
    marginTop: 20,
  },
  infoItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 18,
    borderBottomWidth: StyleSheet.hairlineWidth,
    // borderBottomColor will be themed
  },
  infoItemEditable: { // Style for when it's being edited
    paddingVertical: 10, // Less padding when TextInput is visible
  },
  label: {
    fontSize: 14,
    // color will be themed (muted)
    marginBottom: 4,
  },
  valueText: {
    fontSize: 17,
    flexShrink: 1, // Allow text to wrap if long, next to the icon
    paddingRight: 10, // Space before edit icon
    // color will be themed
  },
  editIconTouchable: {
    padding: 8, // Make touch target larger
  },
  textInput: {
    fontSize: 17,
    paddingVertical: Platform.OS === 'ios' ? 12 : 8, // Adjust padding for input
    flex: 1, // Take available space if next to a save button
    // color and borderColor will be themed
    borderBottomWidth: 1, // Simple underline for editing
  },
  bioInput: {
    minHeight: 80,
    textAlignVertical: 'top', // For multiline
    paddingTop: 12,
  },
  saveButtonContainer: {
    marginLeft: 10,
  },
  saveButton: {
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 6,
    // backgroundColor will be themed
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '500',
    // color will be themed
  },
  actionsSection: {
    marginTop: 30,
    paddingHorizontal: 20,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    borderBottomWidth: StyleSheet.hairlineWidth,
    // borderBottomColor will be themed
  },
  actionButtonText: {
    fontSize: 17,
    marginLeft: 15,
    // color will be themed
  },
  logoutButtonText: {
    // color will be themed (e.g., an error or accent color for logout)
  }
});
