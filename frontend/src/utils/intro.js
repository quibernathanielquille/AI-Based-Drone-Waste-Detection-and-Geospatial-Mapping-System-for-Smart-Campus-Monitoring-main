const INTRO_KEY = 'campus_eye_intro_done';

export const markIntroComplete = () => {
  sessionStorage.setItem(INTRO_KEY, '1');
};

export const hasCompletedIntro = () => sessionStorage.getItem(INTRO_KEY) === '1';

export const clearIntroComplete = () => {
  sessionStorage.removeItem(INTRO_KEY);
};
