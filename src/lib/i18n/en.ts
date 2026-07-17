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
    'person.englishNamePlaceholder': 'English name',
    'person.urduNamePlaceholder': 'اردو نام',
    'person.gender': 'Gender',
    'person.male': 'Male',
    'person.female': 'Female',
    'person.other': 'Other',
    'person.otherOption': 'Other',
    'person.enterManually': 'Enter a value manually',
    'person.birthYear': 'Birth Year',
    'person.deathYear': 'Death Year',
    'person.yearPlaceholder': 'e.g. 1950',
    'person.notes': 'Notes',
    'person.parents': 'Parents',
    'person.siblings': 'Siblings',
    'person.spouses': 'Spouses',
    'person.children': 'Children',
    'person.born': 'Born',
    'person.died': 'Died',
    'person.serialNumber': 'Serial Number',
    'person.country': 'Country',
    'person.stateProvince': 'State / Province',
    'person.city': 'City',
    'person.countryCode': 'Country Code',
    'person.countryCodeAuto': 'Filled from country',
    'person.nationalId': 'National Identity Card Number',
    'person.nationalIdPlaceholder': 'Enter ID number',
    'person.location': 'Location',
    'person.countryPlaceholder': 'Select country',
    'person.countrySearch': 'Search countries...',
    'person.statePlaceholder': 'Select state / province',
    'person.stateSearch': 'Search states...',
    'person.cityPlaceholder': 'Select city',
    'person.citySearch': 'Search cities...',
    'person.customStatePlaceholder': 'Enter state / province',
    'person.customCityPlaceholder': 'Enter city',
    'person.selectCountryFirst': 'Select a country first',
    'person.selectStateFirst': 'Select a state first',
    'person.nameRequired': 'At least one name is required',

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
    'delete.onlyTitle': 'Delete Only This Person',
    'delete.onlyDescription':
        'Remove this person and their spouse links. Descendants stay in the tree and are reattached safely.',
    'delete.branchTitle': 'Delete This Person and All Descendants',
    'delete.branchDescription':
        'Remove this person and soft-delete {count} descendant(s). Spouse people are kept.',
    'delete.rootOnlyBranch':
        'The root person can only be deleted with their whole branch, because there are no parents to receive their children.',

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
    'search.placeholder': 'Search people...',
    'search.noResults': 'No results found',
    'search.filters': 'Filters',
    'search.clearFilters': 'Clear',
    'search.filtersActive': 'Filtered',
    'search.resultCount': '{count} result(s)',
    'search.showMore': 'Show more ({remaining} remaining)',
    'search.serialPlaceholder': 'e.g. FT-000001',
    'search.anyGender': 'Any gender',
    'search.anyCountry': 'Any country',
    'search.anyState': 'Any state / province',
    'search.anyCity': 'Any city',
    'search.noStatesAvailable': 'No states in current data',
    'search.noCitiesAvailable': 'No cities in current data',
    'search.nationalIdPlaceholder': 'Enter ID number to search',

    // Export
    'export.action': 'Export',
    'export.title': 'Export Family Tree',
    'export.description':
        'Download a PDF lineage document for {name} ({serial}).',
    'export.descriptionFallback': 'Choose a language for the PDF export.',
    'export.downloadEnglish': 'Download in English',
    'export.downloadUrdu': 'Download in Urdu',
    'export.documentTitle': '{name} Family Tree Record',
    'export.continuedFrom': 'Continued from',
    'export.success': 'PDF downloaded',
    'export.errorMissingRoot':
        'Export ancestor FT-000007 was not found in the tree.',
    'export.errorNotDescendant':
        'This person is not a descendant of FT-000007.',
    'export.errorGeneric': 'Could not create the PDF export.',

    // Family statistics
    'stats.title': 'Family',
    'stats.total': 'Total',
    'stats.males': 'Males',
    'stats.females': 'Females',

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
