const fs = require('fs');
const path = require('path');

const localesPath = path.join(__dirname, 'src/i18n/locales');

const translations = {
    ar: {
        feedback: {
            sentStatus: '✓ تم الإرسال!',
            sending: 'جاري الإرسال...',
            types: { bug: '🐛 خطأ', suggestion: '💡 فكرة', other: '📝 آخر' }
        },
        submit: {
            voiceMode: 'صوتي',
            needsLabel: 'ماذا يحتاجون؟ (اختياري)',
            tagsLabel: 'من هناك؟ (اختياري)',
            onePerson: 'شخص واحد',
            multiple: 'مجموعة',
            children: 'أطفال',
            animals: 'حيوانات',
            needFood: 'طعام',
            needWater: 'ماء',
            needClothes: 'ملابس',
            needMedicine: 'دواء',Don't change a
            needShelter: 'مأوى'
        }
    },
    de: {
        feedback: {
            sentStatus: '✓ Gesendet!',
            sending: 'Sende...',
            types: { bug: '🐛 Fehler', suggestion: '💡 Idee', other: '📝 Sonstiges' }
        },
        submit: {
            voiceMode: 'Sprache',
            needsLabel: 'Was brauchen sie? (Optional)',
            tagsLabel: 'Wer ist dort? (Optional)',
            onePerson: 'Eine Person',
            multiple: 'Gruppe',
            children: 'Kinder',
            animals: 'Tiere',
            needFood: 'Essen',
            needWater: 'Wasser',
            needClothes: 'Kleidung',
            needMedicine: 'Medizin',
            needShelter: 'Unterkunft'
        }
    },
    es: {
        feedback: {
            sentStatus: '✓ ¡Enviado!',
            sending: 'Enviando...',
            types: { bug: '🐛 Error', suggestion: '💡 Idea', other: '📝 Otro' }
        },
        submit: {
            voiceMode: 'Voz',
            needsLabel: '¿Qué necesitan? (Opcional)',
            tagsLabel: '¿Quién está ahí? (Opcional)',
            onePerson: 'Una persona',
            multiple: 'Grupo',
            children: 'Niños',
            animals: 'Animales',
            needFood: 'Comida',
            needWater: 'Agua',
            needClothes: 'Ropa',
            needMedicine: 'Medicina',
            needShelter: 'Refugio'
        }
    },
    fr: {
        feedback: {
            sentStatus: '✓ Envoyé !',
            sending: 'Envoi...',
            types: { bug: '🐛 Bug', suggestion: '💡 Idée', other: '📝 Autre' }
        },
        submit: {
            voiceMode: 'Voix',
            needsLabel: 'De quoi ont-ils besoin ? (Optionnel)',
            tagsLabel: 'Qui est là ? (Optionnel)',
            onePerson: 'Une personne',
            multiple: 'Groupe',
            children: 'Enfants',
            animals: 'Animaux',
            needFood: 'Nourriture',
            needWater: 'Eau',
            needClothes: 'Vêtements',
            needMedicine: 'Médicaments',
            needShelter: 'Abri'
        }
    },
    it: {
        feedback: {
            sentStatus: '✓ Inviato!',
            sending: 'Invio...',
            types: { bug: '🐛 Bug', suggestion: '💡 Idea', other: '📝 Altro' }
        },
        submit: {
            voiceMode: 'Voce',
            needsLabel: 'Di cosa hanno bisogno? (Opzionale)',
            tagsLabel: 'Chi c\'è? (Opzionale)',
            onePerson: 'Una persona',
            multiple: 'Gruppo',
            children: 'Bambini',
            animals: 'Animali',
            needFood: 'Cibo',
            needWater: 'Acqua',
            needClothes: 'Vestiti',
            needMedicine: 'Medicine',
            needShelter: 'Rifugio'
        }
    },
    nl: {
        feedback: {
            sentStatus: '✓ Verzonden!',
            sending: 'Verzenden...',
            types: { bug: '🐛 Fout', suggestion: '💡 Idee', other: '📝 Overig' }
        },
        submit: {
            voiceMode: 'Stem',
            needsLabel: 'Wat hebben ze nodig? (Optioneel)',
            tagsLabel: 'Wie is daar? (Optioneel)',
            onePerson: 'Eén persoon',
            multiple: 'Groep',
            children: 'Kinderen',
            animals: 'Dieren',
            needFood: 'Eten',
            needWater: 'Water',
            needClothes: 'Kleding',
            needMedicine: 'Medicijnen',
            needShelter: 'Onderdak'
        }
    },
    pt: {
        feedback: {
            sentStatus: '✓ Enviado!',
            sending: 'Enviando...',
            types: { bug: '🐛 Erro', suggestion: '💡 Ideia', other: '📝 Outro' }
        },
        submit: {
            voiceMode: 'Voz',
            needsLabel: 'O que eles precisam? (Opcional)',
            tagsLabel: 'Quem está lá? (Opcional)',
            onePerson: 'Uma pessoa',
            multiple: 'Grupo',
            children: 'Crianças',
            animals: 'Animais',
            needFood: 'Comida',
            needWater: 'Água',
            needClothes: 'Roupas',
            needMedicine: 'Remédio',
            needShelter: 'Abrigo'
        }
    },
    ru: {
        feedback: {
            sentStatus: '✓ Отправлено!',
            sending: 'Отправка...',
            types: { bug: '🐛 Ошибка', suggestion: '💡 Идея', other: '📝 Другое' }
        },
        submit: {
            voiceMode: 'Голос',
            needsLabel: 'Что им нужно? (Опционально)',
            tagsLabel: 'Кто там? (Опционально)',
            onePerson: 'Один человек',
            multiple: 'Группа',
            children: 'Дети',
            animals: 'Животные',
            needFood: 'Еда',
            needWater: 'Вода',
            needClothes: 'Одежда',
            needMedicine: 'Лекарства',
            needShelter: 'Убежище'
        }
    },
    val: {
        feedback: {
            sentStatus: '✓ Enviat!',
            sending: 'Enviant...',
            types: { bug: '🐛 Error', suggestion: '💡 Idea', other: '📝 Altre' }
        },
        submit: {
            voiceMode: 'Veu',
            needsLabel: 'Què necessiten? (Opcional)',
            tagsLabel: 'Qui hi ha? (Opcional)',
            onePerson: 'Una persona',
            multiple: 'Grup',
            children: 'Xiquets',
            animals: 'Animals',
            needFood: 'Menjar',
            needWater: 'Aigua',
            needClothes: 'Roba',
            needMedicine: 'Medicina',
            needShelter: 'Refugi'
        }
    },
    zh: {
        feedback: {
            sentStatus: '✓ 已发送!',
            sending: '发送中...',
            types: { bug: '🐛 错误', suggestion: '💡 想法', other: '📝 其他' }
        },
        submit: {
            voiceMode: '语音',
            needsLabel: '他们需要什么？ (可选)',
            tagsLabel: '那是谁？ (可选)',
            onePerson: '一个人',
            multiple: '团体',
            children: '儿童',
            animals: '动物',
            needFood: '食物',
            needWater: '水',
            needClothes: '衣服',
            needMedicine: '药物',
            needShelter: '避难所'
        }
    }
};

Object.keys(translations).forEach(lang => {
    const filePath = path.join(localesPath, `${lang}.js`);
    if (!fs.existsSync(filePath)) return;

    console.log(`Update ${lang}.js...`);
    let content = fs.readFileSync(filePath, 'utf8');
    const u = translations[lang];

    // FEEDBACK SECTION (Existing replacement logic is fine, keys exist)
    content = content.replace(/sentStatus:\s*'[^']*'/, `sentStatus: '${u.feedback.sentStatus}'`);
    content = content.replace(/sending:\s*'[^']*'/, `sending: '${u.feedback.sending}'`);
    content = content.replace(/bug:\s*'🐛 [^']*'/, `bug: '${u.feedback.types.bug}'`);
    content = content.replace(/suggestion:\s*'💡 [^']*'/, `suggestion: '${u.feedback.types.suggestion}'`);
    content = content.replace(/other:\s*'📝 [^']*'/, `other: '${u.feedback.types.other}'`);

    // SUBMIT SECTION
    const replacements = {
        voiceMode: u.submit.voiceMode,
        needsLabel: u.submit.needsLabel,
        tagsLabel: u.submit.tagsLabel,
        onePerson: u.submit.onePerson,
        multiple: u.submit.multiple,
        children: u.submit.children,
        animals: u.submit.animals,
        needFood: u.submit.needFood,
        needWater: u.submit.needWater,
        needClothes: u.submit.needClothes,
        needMedicine: u.submit.needMedicine,
        needShelter: u.submit.needShelter,
    };

    let missingKeys = [];
    Object.keys(replacements).forEach(key => {
        const regex = new RegExp(`${key}:\\s*'[^']*'`);
        if (regex.test(content)) {
            // Replace if exists
            content = content.replace(regex, `${key}: '${replacements[key]}'`);
        } else {
            // Collect missing
            missingKeys.push(`${key}: '${replacements[key]}'`);
        }
    });

    if (missingKeys.length > 0) {
        // Find the 'submit: {' block and append inside it.
        // We look for the last property in submit block to append after it.
        // A simple way is to find "submit: {" and insert after it, but indentation is tricky.
        // Or find the closing bracket of 'submit' object.
        // We will assume 'submit: {' structure exists.

        // Match: submit: { ... }
        // We can't regex match balanced braces easily in JS. 
        // We'll search for 'submit: {' index.
        const submitStart = content.indexOf('submit: {');
        if (submitStart !== -1) {
            // We need to find the closing brace.
            // We'll manually scan for matching braces.
            let depth = 0;
            let submitEnd = -1;
            for (let i = submitStart; i < content.length; i++) {
                if (content[i] === '{') depth++;
                if (content[i] === '}') {
                    depth--;
                    if (depth === 0) {
                        submitEnd = i;
                        break;
                    }
                }
            }

            if (submitEnd !== -1) {
                // Insert before the closing brace
                const insertion = ',\n        ' + missingKeys.join(',\n        ');
                content = content.slice(0, submitEnd) + insertion + content.slice(submitEnd);
                console.log(`Appended ${missingKeys.length} missing keys to ${lang}.js`);
            } else {
                console.warn('Could not find end of submit block in ' + lang);
            }
        } else {
            console.warn('Could not find submit block in ' + lang);
        }
    }

    fs.writeFileSync(filePath, content);
});

console.log('All missing translations updated.');
