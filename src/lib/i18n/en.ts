import type { TranslationStrings } from '@/types';

export const en: TranslationStrings = {
    // App
    'app.title': 'Zaidi Family Tree',
    'app.subtitle': 'Explore your ancestry',

    // Auth
    'auth.login': 'Log In',
    'auth.signup': 'Sign Up',
    'auth.logout': 'Log Out',
    'auth.email': 'Email',
    'auth.password': 'Password',
    'auth.confirmPassword': 'Confirm Password',
    'auth.noAccount': "Don't have an account?",
    'auth.hasAccount': 'Already have an account?',
    'auth.loginTitle': 'Welcome Back',
    'auth.loginSubtitle': 'Sign in to explore your family tree',
    'auth.signupTitle': 'Create Account',
    'auth.signupSubtitle': 'Join your family tree',

    // Nav
    'nav.search': 'Search people...',
    'nav.fitScreen': 'Fit to Screen',
    'nav.expandAll': 'Expand All',
    'nav.collapseAll': 'Collapse All',
    'nav.language': 'Language',

    // Person
    'person.englishName': 'English Name',
    'person.urduName': 'Urdu Name',
    'person.gender': 'Gender',
    'person.male': 'Male',
    'person.female': 'Female',
    'person.other': 'Other',
    'person.birthYear': 'Birth Year',
    'person.deathYear': 'Death Year',
    'person.notes': 'Notes',
    'person.parents': 'Parents',
    'person.spouses': 'Spouses',
    'person.children': 'Children',
    'person.born': 'Born',
    'person.died': 'Died',

    // Actions
    'action.add': 'Add',
    'action.edit': 'Edit',
    'action.delete': 'Delete',
    'action.save': 'Save',
    'action.cancel': 'Cancel',
    'action.close': 'Close',
    'action.confirm': 'Confirm',
    'action.addChild': 'Add Child',
    'action.addParent': 'Add Parent',
    'action.addSpouse': 'Add Spouse',
    'action.addPerson': 'Add Person',
    'action.editPerson': 'Edit Person',
    'action.addRoot': 'Add Root Person',

    // Delete
    'delete.title': 'Delete Person',
    'delete.confirm': 'Are you sure you want to delete this person?',
    'delete.descendants': 'This will also soft-delete {count} descendant(s).',
    'delete.warning': 'This action will mark the person and their descendants as deleted.',

    // Union
    'union.selectSpouse': 'Select which spouse this child belongs to',
    'union.marriageDate': 'Marriage Date',
    'union.noSpouse': 'No spouse (single parent)',

    // Search
    'search.title': 'Search Family Tree',
    'search.placeholder': 'Type a name to search...',
    'search.noResults': 'No results found',

    // States
    'state.loading': 'Loading...',
    'state.empty': 'No family members yet',
    'state.error': 'Something went wrong',

    // Roles
    'role.admin': 'Admin',
    'role.editor': 'Editor',
    'role.viewer': 'Viewer',

    // Toast
    'toast.saved': 'Changes saved successfully',
    'toast.deleted': 'Deleted successfully',
    'toast.error': 'An error occurred',
    'toast.added': 'Added successfully',
};
