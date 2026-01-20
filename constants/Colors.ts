const tintColorLight = '#4CAF50'; // Green
const tintColorDark = '#81C784'; // Light Green

export const Colors = {
  light: {
    text: '#11181C',
    background: '#fff',
    tint: tintColorLight,
    icon: '#687076',
    tabIconDefault: '#687076',
    tabIconSelected: tintColorLight,
    cardBackground: '#f5f5f5',
    border: '#e0e0e0',
    error: '#d32f2f',
    success: '#4CAF50',
    primary: '#4CAF50',
    primaryDark: '#388E3C',
    secondary: '#2196F3',
    disabled: '#9E9E9E',
    placeholder: '#9E9E9E',
    surface: '#ffffff',
    onSurface: '#000000',
    // Chip colors
    chipBackground: '#E8F5E9',
    chipText: '#2E7D32',
    // Difficulty colors
    difficultyEasy: '#4CAF50',
    difficultyModerate: '#FF9800',
    difficultyHard: '#F44336',
  },
  dark: {
    text: '#ECEFF1',
    background: '#121212',
    tint: tintColorDark,
    icon: '#B0BEC5',
    tabIconDefault: '#B0BEC5',
    tabIconSelected: tintColorDark,
    cardBackground: '#1E1E1E',
    border: '#37474F',
    error: '#ef5350',
    success: '#81C784',
    primary: '#81C784',
    primaryDark: '#66BB6A',
    secondary: '#64B5F6',
    disabled: '#546E7A',
    placeholder: '#90A4AE',
    surface: '#1E1E1E',
    onSurface: '#ECEFF1',
    // Chip colors
    chipBackground: '#2E4D36',
    chipText: '#C2E7C5',
    // Difficulty colors
    difficultyEasy: '#66BB6A',
    difficultyModerate: '#FFB74D',
    difficultyHard: '#E57373',
  },
};

export type ColorScheme = keyof typeof Colors;

export const getDifficultyColor = (difficulty: string, colorScheme: ColorScheme = 'light'): string => {
  switch (difficulty) {
    case 'Easy':
      return Colors[colorScheme].difficultyEasy;
    case 'Moderate':
      return Colors[colorScheme].difficultyModerate;
    case 'Hard':
      return Colors[colorScheme].difficultyHard;
    default:
      return Colors[colorScheme].text;
  }
};
