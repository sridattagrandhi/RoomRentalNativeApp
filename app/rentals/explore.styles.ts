// app/rental/explore.styles.ts
import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: { // For ThemedView
    flex: 1,
  },
  // Main list styling
  listContentContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  
  // Styles for each listing card
  cardContainer: {
    marginBottom: 20,
    borderRadius: 12,
    // iOS shadow
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    // Android shadow
    elevation: 3,
  },
  cardImage: {
    width: '100%',
    height: 220, // Taller images
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  cardContent: {
    padding: 14,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600', // Bolder title
    marginBottom: 6,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  locationText: {
    fontSize: 14,
    marginLeft: 4,
  },
  detailsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    paddingTop: 8,
    // borderTopWidth will be themed
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16, // Space between details
  },
  detailText: {
    fontSize: 14,
    marginLeft: 4,
    fontWeight: '500',
  },
  rentContainer: {
    position: 'absolute',
    top: 12,
    right: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    // backgroundColor will be a semi-transparent theme color
  },
  rentText: {
    fontSize: 16,
    fontWeight: 'bold',
    // color will be themed (e.g., white)
  },

  // Styles for the FAB (Floating Action Button)
  fab: {
    position: 'absolute',
    right: 25,
    bottom: 25,
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
  },
  fabIcon: {
    fontSize: 30,
  },

  // Styles for the empty state
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    fontSize: 17,
    textAlign: 'center',
    marginTop: 10,
  },
});
