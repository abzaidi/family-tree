import type { TranslationStrings } from '@/types';

export const ur: TranslationStrings = {
    // App
    'app.title': 'زیدی خاندانی شجرہ',
    'app.subtitle': 'اپنے خاندان کی تاریخ دریافت کریں',

    // Auth
    'auth.login': 'لاگ ان',
    'auth.signup': 'اکاؤنٹ بنائیں',
    'auth.logout': 'لاگ آؤٹ',
    'auth.email': 'ای میل',
    'auth.password': 'پاس ورڈ',
    'auth.confirmPassword': 'پاس ورڈ کی تصدیق',
    'auth.noAccount': 'اکاؤنٹ نہیں ہے؟',
    'auth.hasAccount': 'پہلے سے اکاؤنٹ ہے؟',
    'auth.loginTitle': 'خوش آمدید',
    'auth.loginSubtitle': 'خاندانی شجرے میں داخل ہوں',
    'auth.signupTitle': 'اکاؤنٹ بنائیں',
    'auth.signupSubtitle': 'اپنے خاندان سے جڑیں',

    // Nav
    'nav.search': 'لوگوں کو تلاش کریں...',
    'nav.fitScreen': 'اسکرین پر فٹ کریں',
    'nav.expandAll': 'سب کھولیں',
    'nav.collapseAll': 'سب بند کریں',
    'nav.language': 'زبان',
    'nav.manageUsers': 'صارفین کا انتظام',

    // Theme
    'theme.label': 'تھیم',
    'theme.light': 'روشن',
    'theme.dark': 'تاریک',
    'theme.system': 'سسٹم',

    // Admin
    'admin.usersTitle': 'صارفین کا انتظام',
    'admin.usersSubtitle': 'سائن اپ شدہ صارفین دیکھیں اور ان کی اجازتیں تبدیل کریں',
    'admin.backToTree': 'شجرے پر واپس',
    'admin.name': 'نام',
    'admin.email': 'ای میل',
    'admin.joined': 'شمولیت',
    'admin.role': 'کردار',
    'admin.refresh': 'تازہ کریں',
    'admin.noUsers': 'کوئی صارف نہیں ملا',
    'admin.noName': 'نام نہیں',
    'admin.noEmail': 'ای میل نہیں',
    'admin.you': 'آپ',
    'admin.userCount': '{count} صارف',

    // Person
    'person.englishName': 'انگریزی نام',
    'person.urduName': 'اردو نام',
    'person.gender': 'جنس',
    'person.male': 'مرد',
    'person.female': 'عورت',
    'person.other': 'دیگر',
    'person.birthYear': 'سالِ پیدائش',
    'person.deathYear': 'سالِ وفات',
    'person.notes': 'نوٹس',
    'person.parents': 'والدین',
    'person.siblings': 'بہن بھائی',
    'person.spouses': 'ازواج',
    'person.children': 'اولاد',
    'person.born': 'پیدائش',
    'person.died': 'وفات',

    // Actions
    'action.add': 'شامل کریں',
    'action.edit': 'ترمیم',
    'action.delete': 'حذف',
    'action.save': 'محفوظ کریں',
    'action.cancel': 'منسوخ',
    'action.close': 'بند کریں',
    'action.confirm': 'تصدیق',
    'action.addChild': 'بچہ شامل کریں',
    'action.addSpouse': 'شریکِ حیات شامل کریں',
    'action.insertMiddle': 'درمیان میں فرد شامل کریں',
    'action.addPerson': 'فرد شامل کریں',
    'action.editPerson': 'فرد میں ترمیم',
    'action.addRoot': 'بنیادی فرد شامل کریں',

    // Delete
    'delete.title': 'فرد کو حذف کریں',
    'delete.confirm': 'کیا آپ واقعی اس فرد کو حذف کرنا چاہتے ہیں؟',
    'delete.descendants': 'اس سے {count} اولاد بھی حذف ہو جائے گی۔',
    'delete.warning': 'یہ عمل فرد اور ان کی اولاد کو حذف شدہ نشان زد کر دے گا۔',

    // Union
    'union.selectSpouse': 'منتخب کریں کہ یہ بچہ کس شریکِ حیات سے ہے',
    'union.marriageDate': 'تاریخِ نکاح',
    'union.noSpouse': 'بغیر شریکِ حیات',
    'union.spouseChildrenQuestion': 'موجودہ بچوں میں سے کون اس شریکِ حیات کی بھی اولاد ہے؟',
    'union.none': 'کوئی نہیں',

    // Insert generation
    'insert.description': 'موجودہ براہِ راست والدین اور بچے کو منتخب کریں۔ نیا فرد ان کے درمیان شامل ہو جائے گا۔',
    'insert.selectParent': 'والدین منتخب کریں',
    'insert.selectChild': 'بچہ منتخب کریں',
    'insert.samePersonError': 'والدین اور بچہ ایک ہی فرد نہیں ہو سکتے۔',
    'insert.notDirectError': 'منتخب بچہ اس وقت منتخب والدین کا براہِ راست بچہ ہونا چاہیے۔',
    'insert.selectionRequired': 'درست براہِ راست والدین اور بچے کو منتخب کریں۔',

    // Search
    'search.title': 'خاندانی شجرے میں تلاش کریں',
    'search.placeholder': 'نام ٹائپ کریں...',
    'search.noResults': 'کوئی نتائج نہیں ملے',

    // States
    'state.loading': 'لوڈ ہو رہا ہے...',
    'state.empty': 'ابھی کوئی خاندانی رکن نہیں',
    'state.error': 'کچھ غلط ہو گیا',

    // Roles
    'role.admin': 'ایڈمن',
    'role.editor': 'ایڈیٹر',
    'role.viewer': 'ناظر',

    // Toast
    'toast.saved': 'تبدیلیاں محفوظ ہو گئیں',
    'toast.deleted': 'کامیابی سے حذف ہو گیا',
    'toast.error': 'ایک خرابی واقع ہوئی',
    'toast.added': 'کامیابی سے شامل ہو گیا',
};
