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
    'nav.manageUsers': 'Manage users',

    // Theme
    'theme.label': 'Theme',
    'theme.light': 'Light',
    'theme.dark': 'Dark',
    'theme.system': 'System',

    // Admin
    'admin.usersTitle': 'User Management',
    'admin.usersSubtitle': 'View signed-up users and update their permissions',
    'admin.backToTree': 'Back to tree',
    'admin.name': 'Name',
    'admin.email': 'Email',
    'admin.joined': 'Joined',
    'admin.role': 'Role',
    'admin.refresh': 'Refresh',
    'admin.noUsers': 'No users found',
    'admin.noName': 'No name',
    'admin.noEmail': 'No email',
    'admin.you': 'You',
    'admin.userCount': '{count} user(s)',

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
    'person.siblings': 'Siblings',
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
    'action.addSpouse': 'Add Spouse',
    'action.insertMiddle': 'Insert Person in Middle',
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
    'union.spouseChildrenQuestion': 'Which existing children also belong to this spouse?',
    'union.none': 'None',

    // Insert generation
    'insert.description': 'Choose an existing direct parent and child. The new person will be inserted between them.',
    'insert.selectParent': 'Select Parent',
    'insert.selectChild': 'Select Child',
    'insert.samePersonError': 'The parent and child cannot be the same person.',
    'insert.notDirectError': 'The selected child must currently be a direct child of the selected parent.',
    'insert.selectionRequired': 'Select a valid direct parent and child.',

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
