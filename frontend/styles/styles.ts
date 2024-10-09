import { StyleSheet, Dimensions } from 'react-native';

const { width, height } = Dimensions.get('window');

const primaryColor = '#6A0DAD';
const secondaryColor = '#FF69B4';
const backgroundColor = '#F0E6FF';
const textColor = '#4A0E4E';
const inputBackgroundColor = '#FFFFFF';

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  gameWrapper: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  mainHeader: {
    fontSize: 36,
    fontWeight: 'bold',
    textAlign: 'center',
    marginVertical: 20,
    color: '#FFFFFF',
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: -1, height: 1 },
    textShadowRadius: 10,
  },
  modeSelectionContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    maxWidth: 400,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderRadius: 20,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  heading: {
    fontSize: 24,
    color: primaryColor,
    fontWeight: 'bold',
    marginVertical: 10,
    textAlign: 'center',
  },
  input: {
    flex: 1,
    padding: 15,
    marginRight: 10,
    borderColor: secondaryColor,
    borderWidth: 2,
    borderRadius: 25,
    color: textColor,
    backgroundColor: inputBackgroundColor,
    fontSize: 16,
  },
  buttonContainer: {
    marginVertical: 10,
    width: '100%',
    alignItems: 'center',
  },
  button: {
    backgroundColor: primaryColor,
    padding: 15,
    borderRadius: 25,
    alignItems: 'center',
    width: '100%',
    maxWidth: 300,
    flexDirection: 'row',
    justifyContent: 'center',
  },
  buttonDisabled: {
    backgroundColor: '#555',
    opacity: 0.5,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    marginLeft: 10,
  },
  buttonIcon: {
    marginRight: 10,
  },
  gameIdContainer: {
    alignItems: 'center',
    marginVertical: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderRadius: 15,
    padding: 15,
  },
  gameIdLabel: {
    fontSize: 18,
    color: textColor,
    marginBottom: 5,
  },
  gameId: {
    fontSize: 36,
    fontWeight: 'bold',
    color: primaryColor,
  },
  playersListContainer: {
    width: '100%',
    maxWidth: 400,
    marginVertical: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderRadius: 15,
    padding: 15,
  },
  playerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 5,
  },
  playerIcon: {
    marginRight: 10,
  },
  playerName: {
    fontSize: 18,
    color: textColor,
  },
  container: {
    flex: 1,
  },
  emojiBackgroundContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emojiRow: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  emojiBackgroundText: {
    fontSize: 40,
    opacity: 0.4,
    margin: 5,
  },
  sparklesIcon: {
    position: 'absolute',
    top: 10,
    right: 10,
  },
  gameContainer: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  gameContent: {
    alignItems: 'center',
    width: '100%',
  },
  congratsContent: {
    alignItems: 'center',
  },
  celebrateEmoji: {
    fontSize: 80,
    marginBottom: 20,
  },
  congratsMessage: {
    fontSize: 24,
    textAlign: 'center',
    marginVertical: 20,
    color: textColor,
    fontWeight: 'bold',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    marginBottom: 10,
  },
  sendButton: {
    backgroundColor: primaryColor,
    padding: 15,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sideMenuContent: {
    width: '80%',
    maxWidth: 400,
    backgroundColor: backgroundColor,
    borderRadius: 20,
    padding: 20,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  closeButton: {
    backgroundColor: primaryColor,
    padding: 10,
    borderRadius: 20,
  },
  historyItem: {
    marginVertical: 5,
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
    paddingBottom: 10,
  },
  boldText: {
    fontWeight: 'bold',
    color: textColor,
  },
  guessCounter: {
    fontSize: 18,
    marginTop: 10,
    color: textColor,
    fontWeight: 'bold',
  },
  turnIndicator: {
    fontSize: 20,
    marginBottom: 15,
    textAlign: 'center',
    color: primaryColor,
    fontWeight: 'bold',
  },
  historyButtonContainer: {
    marginTop: 20,
    width: '100%',
    alignItems: 'center',
  },
  historyButton: {
    backgroundColor: secondaryColor,
    padding: 15,
    borderRadius: 25,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  historyButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 10,
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
    height: 120,
  },
  loadingText: {
    marginTop: 15,
    fontSize: 18,
    color: primaryColor,
    fontWeight: 'bold',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  firstGuessMessage: {
    fontSize: 20,
    color: secondaryColor,
    marginVertical: 10,
    textAlign: 'center',
    fontWeight: 'bold',
  },
  latestMessageContainer: {
    marginVertical: 10,
    width: '100%',
    paddingHorizontal: 10,
    alignItems: 'center',
  },
  guessBubble: {
    backgroundColor: '#b1f0c6',
    padding: 15,
    borderRadius: 20,
    marginBottom: 10,
    maxWidth: '80%',
    alignSelf: 'flex-end',
  },
  responseBubble: {
    backgroundColor: '#d3cce6',
    padding: 15,
    borderRadius: 20,
    marginBottom: 10,
    maxWidth: '80%',
    alignSelf: 'flex-start',
  },
  messageText: {
    fontSize: 16,
    color: textColor,
  },
  messageContainer: {
    marginVertical: 10,
    width: '100%',
    paddingHorizontal: 10,
  },
  feedbackMessage: {
    fontSize: 18,
    color: primaryColor,
    textAlign: 'center',
    marginVertical: 10,
    fontWeight: 'bold',
    padding: 10,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
  },
});

export default styles;