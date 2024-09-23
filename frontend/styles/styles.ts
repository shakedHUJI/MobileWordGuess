import { StyleSheet } from 'react-native';

const primaryColor = '#40798C';
const secondaryColor = '#6FA8DC';
const backgroundColor = '#F4FAFF';
const textColor = '#1F363D';
const inputBackgroundColor = '#FFFFFF';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: backgroundColor,
  },
  emojiBackgroundContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    flex: 1,
    zIndex: -1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emojiRow: {
    flexDirection: 'row',
  },
  emojiBackgroundText: {
    fontSize: 40,
    margin: 5,
    opacity: 0.3,
  },
  mainHeader: {
    fontSize: 36,
    fontWeight: 'bold',
    textAlign: 'center',
    marginVertical: 20,
    color: '#2A4D5D',  // Changed to a darker shade
  },
  modeSelectionContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  setupContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
  },
  gameContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
    fontSize: 20,
    textAlign: 'center',
    marginVertical: 20,
    color: textColor,
  },
  input: {
    width: '80%',
    padding: 15,
    marginVertical: 10,
    borderColor: secondaryColor,
    borderWidth: 1,
    borderRadius: 10,
    color: textColor,
    backgroundColor: inputBackgroundColor,
  },
  sideMenuContent: {
    flex: 1,
    padding: 20,
    backgroundColor: backgroundColor,
    justifyContent: 'space-between', // This will push the button to the bottom
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
  feedbackMessage: {
    fontSize: 18,
    marginBottom: 20,
    textAlign: 'center',
    color: textColor,
  },
  heading: {
    fontSize: 24,
    marginVertical: 10,
    textAlign: 'center',
    color: secondaryColor,
    fontWeight: 'bold',
  },
  responseContainer: {
    marginTop: 20,
    width: '80%',
    maxHeight: 200,
  },
  responseText: {
    fontSize: 16,
    marginBottom: 10,
    color: textColor,
  },
  emojiText: {
    fontSize: 50,
    textAlign: 'center',
    marginTop: 10,
  },
  guessCounter: {
    fontSize: 16,
    marginTop: 10,
    color: textColor,
  },
  turnIndicator: {
    fontSize: 18,
    marginBottom: 10,
    textAlign: 'center',
    color: textColor,
  },
  historyText: {
    fontSize: 16,
    marginBottom: 5,
    color: textColor,
  },
  buttonContainer: {
    marginVertical: 10,
    width: '100%',
    alignItems: 'center',
  },
  historyButtonContainer: {
    marginTop: 10,
    width: '100%',
    alignItems: 'center',
  },
  button: {
    backgroundColor: primaryColor,
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    width: '80%', // Set a fixed width for all buttons
    maxWidth: 300, // Limit maximum width for larger screens
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
  },
  gameIdContainer: {
    alignItems: 'center',
    marginVertical: 20,
  },
  gameIdLabel: {
    fontSize: 18,
    color: textColor,
  },
  gameId: {
    fontSize: 36,
    fontWeight: 'bold',
    color: primaryColor,
    marginTop: 10,
  },
  playersListContainer: {
    width: '80%',
    marginVertical: 20,
  },
  playerItem: {
    fontSize: 18,
    color: textColor,
    marginVertical: 5,
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
    height: 120, // Increased height to accommodate larger spinner
  },
  loadingText: {
    marginTop: 15, // Increased margin to separate text from larger spinner
    fontSize: 18, // Slightly larger font size
    color: '#333',
  },
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  alertBox: {
    width: 300,
    padding: 20,
    backgroundColor: 'white',
    borderRadius: 10,
    alignItems: 'center',
  },
  alertTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    color: textColor,
  },
  alertMessage: {
    fontSize: 16,
    marginBottom: 20,
    textAlign: 'center',
    color: textColor,
  },
  alertButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    backgroundColor: primaryColor,
    borderRadius: 5,
  },
  alertButtonText: {
    color: 'white',
    fontSize: 16,
  },
  firstGuessMessage: {
    fontSize: 18,
    color: secondaryColor,
    marginVertical: 10,
    textAlign: 'center',
  },
});

export default styles;