// styles.ts

import { StyleSheet, Dimensions, Platform } from 'react-native';

const { width, height } = Dimensions.get('window');

// Update these color definitions at the top of the file
const primaryColor = '#00FFFF'; // Cyan for a futuristic look
const secondaryColor = '#4ECDC4'; // A softer teal color
const backgroundColor = '#1E2A3A'; // Dark blue-grayish background
const textColor = '#FFFFFF'; // White text for readability
const inputBackgroundColor = '#2A3C50'; // Slightly lighter than the background

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: backgroundColor,
  },
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  gameWrapper: {
    flex: 1,
    justifyContent: 'flex-start',
    alignItems: 'center',
    backgroundColor: 'transparent',
    paddingTop: 20,
    paddingBottom: 20,
  },
  mainHeader: {
    fontSize: 36,
    fontWeight: 'bold',
    textAlign: 'center',
    marginVertical: 20,
    color: primaryColor,
    textShadowColor: 'rgba(0, 255, 255, 0.75)',
    textShadowOffset: { width: -1, height: 1 },
    textShadowRadius: 10,
  },
  modeSelectionContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    maxWidth: 400,
    backgroundColor: 'rgba(42, 60, 80, 0.8)',
    borderRadius: 20,
    padding: 20,
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
    color: secondaryColor,
    fontWeight: 'bold',
    marginVertical: 10,
    textAlign: 'center',
  },
  input: {
    flex: 1,
    padding: 15,
    marginRight: 10,
    borderColor: primaryColor,
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
    margin: 5,
    alignItems: 'center',
    width: 250,
    maxWidth: 300,
    flexDirection: 'row',
    justifyContent: 'center',
  },
  buttonDisabled: {
    backgroundColor: '#555',
    opacity: 0.5,
  },
  buttonText: {
    color: backgroundColor,
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    marginLeft: 10,
  },
  buttonIcon: {
    marginRight: 10,
  },
  gameContainer: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: 'rgba(42, 60, 80, 0.8)',
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    shadowColor: primaryColor,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    borderWidth: 1,
    borderColor: primaryColor,
    marginBottom: 20,
    flex: 1,
  },
  gameContent: {
    alignItems: 'center',
    width: '100%',
    flex: 1,
  },
  congratsContent: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
  celebrateEmoji: {
    fontSize: 80,
    marginBottom: 20,
  },
  congratsMessage: {
    fontSize: 24,
    textAlign: 'center',
    marginVertical: 20,
    color: primaryColor,
    fontWeight: 'bold',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    marginBottom: 10,
  },
  sendButton: {
    backgroundColor: secondaryColor,
    padding: 15,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    width: 50,
    height: 50,
  },
  sideMenuContent: {
    width: '90%',
    maxWidth: 400,
    backgroundColor: backgroundColor,
    borderRadius: 20,
    padding: 20,
    maxHeight: '80%',
    borderWidth: 1,
    borderColor: primaryColor,
    elevation: 5,
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  closeButton: {
    backgroundColor: secondaryColor,
    padding: 6,
    borderRadius: 20,

  },
  boldText: {
    fontWeight: 'bold',
    color: primaryColor,
  },
  guessCounter: {
    fontSize: 18,
    marginTop: 10,
    color: secondaryColor,
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
    paddingHorizontal: 10,
    
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
    color: backgroundColor,
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
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
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
    borderRadius: 15,
    borderWidth: 0,
    padding: 10,
    backgroundColor: 'rgba(0, 0, 0, 0)',
  },
  guessBubble: {
    backgroundColor: 'rgba(0, 255, 255, 0.2)',
    padding: 15,
    borderRadius: 20,
    marginBottom: 10,
    alignSelf: 'flex-end',
    borderWidth: 1,
    borderColor: primaryColor,
  },
  responseBubble: {
    backgroundColor: 'rgba(255, 0, 255, 0.2)',
    padding: 15,
    borderRadius: 20,
    marginBottom: 10,
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: secondaryColor,
  },
  messageText: {
    fontSize: 16,
    color: textColor,
  },
  messageContainer: {
    flex: 1,
    width: '100%',
  },
  feedbackMessage: {
    fontSize: 18,
    color: primaryColor,
    textAlign: 'center',
    marginVertical: 10,
    fontWeight: 'bold',
    padding: 10,
    borderRadius: 10,
    backgroundColor: 'rgba(42, 60, 80, 0.8)',
    borderWidth: 1,
    borderColor: secondaryColor,
  },
  animatedBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  scrollViewContainer: {
    flexGrow: 1,
    width: '100%',
  },
  scrollContent: {
    flexGrow: 1,
  },
  sparklesIcon: {
    position: 'absolute',
    top: 10,
    right: 10,
    color: secondaryColor,
  },
  wizardNameInput: {
    width: '100%',
    padding: 15,
    marginBottom: 20,
    borderColor: primaryColor,
    borderWidth: 2,
    borderRadius: 25,
    color: textColor,
    backgroundColor: 'rgba(42, 60, 80, 0.8)',
    fontSize: 16,
    textAlign: 'center',
  },
  gameIdContainer: {
    alignItems: 'center',
    marginBottom: 20,
    backgroundColor: 'rgba(42, 60, 80, 0.8)',
    borderRadius: 15,
    padding: 15,
    borderWidth: 1,
    borderColor: primaryColor,
  },
  gameIdLabel: {
    fontSize: 18,
    color: secondaryColor,
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
    backgroundColor: 'rgba(42, 60, 80, 0.8)',
    borderRadius: 15,
    padding: 15,
    borderWidth: 1,
    borderColor: secondaryColor,
  },
  playerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 5,
  },
  playerIcon: {
    marginRight: 10,
    color: secondaryColor,
  },
  playerName: {
    fontSize: 18,
    color: textColor,
  },
  // Added styles for animated emojis
  animatedEmoji: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  emojiText: {
    fontSize: 30, // Adjust the size as needed
  },
  backButton: {
    position: 'absolute',
    top: 30,
    left: 10,
    zIndex: 10,
    padding: 10,
  },
  popupContainer: {
    width: '90%',
    maxWidth: 400,
    backgroundColor: backgroundColor,
    borderRadius: 20,
    padding: 20,
    maxHeight: '80%',
    borderWidth: 1,
    borderColor: primaryColor,
    elevation: 5,
  },
  popupHeader: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  closeButtonContainer: {
    flexDirection: 'row-reverse',
    justifyContent: 'flex-start',
    alignItems: 'center',
  },
  popupTitle: {
    fontSize: 24,
    color: primaryColor,
    fontWeight: 'bold',
  },
  popupContent: {
    maxHeight: '80%',
  },
  popupText: {
    fontSize: 16,
    color: textColor,
    lineHeight: 24,
  },
  instructionsButton: {
    position: 'absolute',
    top: 30,
    right: 10,
    zIndex: 10,
    padding: 10,
    backgroundColor: secondaryColor,
    borderRadius: 20,
  },
  errorText: {
    color: 'red',
    fontSize: 12,
    marginTop: 5,
  },
  bulbButton: {
    backgroundColor: secondaryColor,
    borderRadius: 50,
    padding: 10,
    marginLeft: 10,


  },
  hintButtonContainer: {
    marginTop: 20,
    width: '100%',
    alignItems: 'center',
  },
  hintButton: {
    backgroundColor: secondaryColor,
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    width: '80%',
  },
  hintButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  hintButtonIcon: {
    marginRight: 10,
  },
  hintButtonText: {
    color: '#1E2A3A',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default styles;
