// app/(tabs)/chats.styles.ts
import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
    safeArea: { 
        flex: 1 
    },
    emptyContainer: { 
        flex: 1, 
        justifyContent: 'center', 
        alignItems: 'center',
        padding: 20,
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginHorizontal: 16,
        marginVertical: 8,
        paddingHorizontal: 12,
        borderRadius: 10,
        borderWidth: 1,
        height: 44,
    },
    searchIcon: {
        marginRight: 8,
    },
    searchInput: {
        flex: 1,
        fontSize: 16,
    },
    chatItemContainer: { 
        flexDirection: 'row', 
        paddingHorizontal: 16, 
        paddingVertical: 12, 
        alignItems: 'center' 
    },
    avatar: { 
        width: 50, 
        height: 50, 
        borderRadius: 25, 
        marginRight: 12, 
        backgroundColor: '#eee' 
    },
    textContainer: { 
        flex: 1, 
        justifyContent: 'center' 
    },
    recipientName: { 
        fontSize: 16, 
        fontWeight: '600', 
        marginBottom: 4 
    },
    lastMessageText: { 
        fontSize: 14 
    },
    metaContainer: { 
        alignItems: 'flex-end' 
    },
    timestamp: { 
        fontSize: 12, 
        marginBottom: 6 
    },
    unreadBadge: { 
        minWidth: 22, 
        height: 22, 
        borderRadius: 11, 
        justifyContent: 'center', 
        alignItems: 'center', 
        paddingHorizontal: 6 
    },
    unreadText: { 
        color: 'white', 
        fontSize: 12, 
        fontWeight: 'bold' 
    },
    separator: { 
        height: 1, 
        marginLeft: 78, 
        marginRight: 16 
    },
    emptyText: { 
        fontSize: 18, 
        fontWeight: '500', 
        marginTop: 12,
        textAlign: 'center',
    },
});
