import { StyleSheet, Platform } from 'react-native';

export const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: { // For ThemedView
    flex: 1,
  },
  listContainer: {
    flex: 1,
  },
  listContentContainer: {
    paddingVertical: 8,
  },
  chatItemContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    alignItems: 'center',
    // borderBottomWidth: StyleSheet.hairlineWidth, // Optional separator
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 12,
    // backgroundColor will be themed (placeholder color)
  },
  textContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  recipientName: {
    fontSize: 17,
    fontWeight: '500', // Medium weight
    marginBottom: 3,
  },
  lastMessageText: {
    fontSize: 14,
    // color will be themed (muted)
  },
  metaContainer: {
    alignItems: 'flex-end',
    marginLeft: 8, // Space between text and meta info
  },
  timestamp: {
    fontSize: 12,
    marginBottom: 4,
    // color will be themed (muted)
  },
  unreadBadge: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    paddingHorizontal: 6, // Add padding if count is > 9
    justifyContent: 'center',
    alignItems: 'center',
    // backgroundColor will be themed (primary or accent)
  },
  unreadText: {
    fontSize: 12,
    fontWeight: 'bold',
    // color will be themed (e.g., white)
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    fontSize: 17,
    textAlign: 'center',
    // color will be themed
  },
  separator: {
    height: StyleSheet.hairlineWidth,
    marginLeft: 16 + 50 + 12, // Avatar width + margins
    // backgroundColor will be themed
  }
});
