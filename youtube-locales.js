(function initializeYouTubeLocales(global) {
    'use strict';

    const localeTerms = Object.freeze({
        en: {
            playables: ['playables'], mix: ['mix'], podcast: ['podcast'],
            viewFullPlaylist: ['view full playlist'], playlist: ['playlist'], tryNow: ['try now'],
            membersOnly: ['members only', 'members-only'], upcoming: ['upcoming'],
            premierePrefixes: ['premieres ', 'premiere '], scheduledPrefixes: ['scheduled for '],
            notifyMe: ['notify me'], downloads: ['downloads'],
            watchLaterActions: ['watch later', 'save to watch later'], notInterestedActions: ['not interested'],
            watchLaterLabel: 'Watch Later', notInterestedLabel: 'Not Interested'
        },
        es: {
            playables: ['jugables'], mix: ['mix'], podcast: ['podcast'],
            viewFullPlaylist: ['ver lista de reproducción completa'], playlist: ['lista de reproducción'], tryNow: ['probar ahora'],
            membersOnly: ['solo para miembros', 'exclusivo para miembros'], upcoming: ['próximamente'],
            premierePrefixes: ['se estrena ', 'estreno '], scheduledPrefixes: ['programado para '],
            notifyMe: ['notificarme', 'recibir recordatorio'], downloads: ['descargas'],
            watchLaterActions: ['ver más tarde', 'guardar en ver más tarde'], notInterestedActions: ['no me interesa'],
            watchLaterLabel: 'Ver más tarde', notInterestedLabel: 'No me interesa'
        },
        pt_PT: {
            playables: ['sala de jogos'], mix: ['mix'], podcast: ['podcast'],
            viewFullPlaylist: ['ver playlist completa', 'ver lista de reprodução completa'], playlist: ['playlist', 'lista de reprodução'], tryNow: ['experimentar agora'],
            membersOnly: ['apenas para membros', 'exclusivo para membros'], upcoming: ['em breve'],
            premierePrefixes: ['estreia ', 'estreia em '], scheduledPrefixes: ['agendado para '],
            notifyMe: ['notificar-me', 'receber lembrete'], downloads: ['transferências'],
            watchLaterActions: ['ver mais tarde', 'guardar em ver mais tarde'], notInterestedActions: ['não tenho interesse'],
            watchLaterLabel: 'Ver mais tarde', notInterestedLabel: 'Não tenho interesse'
        },
        pt_BR: {
            playables: ['sala de jogos'], mix: ['mix'], podcast: ['podcast'],
            viewFullPlaylist: ['ver playlist completa', 'ver lista de reprodução completa'], playlist: ['playlist', 'lista de reprodução'], tryNow: ['teste agora', 'experimentar agora'],
            membersOnly: ['somente para membros', 'exclusivo para membros'], upcoming: ['em breve'],
            premierePrefixes: ['estreia ', 'estreia em '], scheduledPrefixes: ['programado para '],
            notifyMe: ['receber notificação', 'definir lembrete'], downloads: ['downloads'],
            watchLaterActions: ['assistir mais tarde', 'salvar em assistir mais tarde'], notInterestedActions: ['não tenho interesse'],
            watchLaterLabel: 'Assistir mais tarde', notInterestedLabel: 'Não tenho interesse'
        },
        id: {
            playables: ['ruang game'], mix: ['mix'], podcast: ['podcast'],
            viewFullPlaylist: ['lihat playlist lengkap'], playlist: ['playlist'], tryNow: ['coba sekarang'],
            membersOnly: ['khusus pelanggan', 'khusus anggota'], upcoming: ['mendatang'],
            premierePrefixes: ['tayang perdana '], scheduledPrefixes: ['dijadwalkan untuk '],
            notifyMe: ['beri tahu saya'], downloads: ['download'],
            watchLaterActions: ['tonton nanti', 'simpan ke tonton nanti'], notInterestedActions: ['tidak tertarik'],
            watchLaterLabel: 'Tonton nanti', notInterestedLabel: 'Tidak tertarik'
        },
        ja: {
            playables: ['ゲームルーム'], mix: ['ミックス', 'mix'], podcast: ['ポッドキャスト'],
            viewFullPlaylist: ['再生リストをすべて表示'], playlist: ['再生リスト'], tryNow: ['今すぐ試す'],
            membersOnly: ['メンバー限定'], upcoming: ['近日公開', '公開予定'],
            premierePrefixes: ['プレミア公開'], scheduledPrefixes: ['公開予定'],
            notifyMe: ['通知する'], downloads: ['オフライン', 'ダウンロード'],
            watchLaterActions: ['後で見る', '「後で見る」に保存'], notInterestedActions: ['興味がない', '興味なし'],
            watchLaterLabel: '後で見る', notInterestedLabel: '興味がない'
        },
        de: {
            playables: ['playables'], mix: ['mix'], podcast: ['podcast'],
            viewFullPlaylist: ['vollständige playlist ansehen'], playlist: ['playlist'], tryNow: ['jetzt testen'],
            membersOnly: ['nur für mitglieder'], upcoming: ['demnächst'],
            premierePrefixes: ['premiere '], scheduledPrefixes: ['geplant für '],
            notifyMe: ['benachrichtigung aktivieren', 'erinnerung einrichten'], downloads: ['downloads'],
            watchLaterActions: ['später ansehen', 'auf „später ansehen“ speichern'], notInterestedActions: ['kein interesse'],
            watchLaterLabel: 'Später ansehen', notInterestedLabel: 'Kein Interesse'
        },
        fr: {
            playables: ['jeux intégrés'], mix: ['mix'], podcast: ['podcast'],
            viewFullPlaylist: ['afficher la playlist complète'], playlist: ['playlist'], tryNow: ['essayer', 'essayer maintenant'],
            membersOnly: ['réservé aux membres', 'réservée aux membres'], upcoming: ['à venir'],
            premierePrefixes: ['première '], scheduledPrefixes: ['prévue pour ', 'prévu pour '],
            notifyMe: ['définir un rappel', 'me prévenir'], downloads: ['téléchargements'],
            watchLaterActions: ['à regarder plus tard', 'enregistrer dans « à regarder plus tard »'], notInterestedActions: ['pas intéressé'],
            watchLaterLabel: 'À regarder plus tard', notInterestedLabel: 'Pas intéressé'
        },
        hi: {
            playables: ['playables'], mix: ['मिक्स'], podcast: ['पॉडकास्ट'],
            viewFullPlaylist: ['पूरी प्लेलिस्ट देखें'], playlist: ['प्लेलिस्ट'], tryNow: ['अभी आज़माएं', 'अभी आज़माएँ'],
            membersOnly: ['सिर्फ़ सदस्यों के लिए', 'केवल सदस्यों के लिए'], upcoming: ['आगामी'],
            premierePrefixes: ['प्रीमियर '], scheduledPrefixes: ['इसके लिए शेड्यूल किया गया '],
            notifyMe: ['मुझे सूचना दें'], downloads: ['डाउनलोड'],
            watchLaterActions: ['बाद में देखें', 'बाद में देखें में सेव करें'], notInterestedActions: ['दिलचस्पी नहीं है'],
            watchLaterLabel: 'बाद में देखें', notInterestedLabel: 'दिलचस्पी नहीं है'
        },
        vi: {
            playables: ['chơi game'], mix: ['tuyển tập', 'mix'], podcast: ['podcast'],
            viewFullPlaylist: ['xem toàn bộ danh sách phát'], playlist: ['danh sách phát'], tryNow: ['dùng thử ngay'],
            membersOnly: ['chỉ dành cho hội viên'], upcoming: ['sắp ra mắt'],
            premierePrefixes: ['công chiếu '], scheduledPrefixes: ['đã lên lịch vào '],
            notifyMe: ['nhắc tôi'], downloads: ['video đã tải xuống', 'nội dung tải xuống'],
            watchLaterActions: ['xem sau', 'lưu vào danh sách xem sau'], notInterestedActions: ['không quan tâm'],
            watchLaterLabel: 'Xem sau', notInterestedLabel: 'Không quan tâm'
        },
        tr: {
            playables: ['hazır oyunlar'], mix: ['mix'], podcast: ['podcast'],
            viewFullPlaylist: ['oynatma listesinin tamamını görüntüle'], playlist: ['oynatma listesi'], tryNow: ['şimdi dene'],
            membersOnly: ['yalnızca üyelere özel'], upcoming: ['yakında'],
            premierePrefixes: ['ilk gösterim '], scheduledPrefixes: ['planlanan tarih ', 'şu tarih için planlandı '],
            notifyMe: ['hatırlatıcı ayarla'], downloads: ['indirilenler'],
            watchLaterActions: ['daha sonra izle', "daha sonra izle'ye kaydet"], notInterestedActions: ['ilgilenmiyorum'],
            watchLaterLabel: 'Daha sonra izle', notInterestedLabel: 'İlgilenmiyorum'
        },
        ko: {
            playables: ['게임 룸', '게임룸'], mix: ['믹스'], podcast: ['팟캐스트'],
            viewFullPlaylist: ['전체 재생목록 보기'], playlist: ['재생목록'], tryNow: ['지금 사용해 보기'],
            membersOnly: ['회원 전용'], upcoming: ['공개 예정'],
            premierePrefixes: ['최초 공개 '], scheduledPrefixes: ['예약 시간 ', '공개 예정 '],
            notifyMe: ['알림 받기'], downloads: ['오프라인 저장 동영상', '다운로드'],
            watchLaterActions: ['나중에 볼 동영상', '나중에 볼 동영상에 저장'], notInterestedActions: ['관심 없음'],
            watchLaterLabel: '나중에 볼 동영상', notInterestedLabel: '관심 없음'
        },
        ar: {
            playables: ['هيّا نلعب', 'هيا نلعب'], mix: ['مزيج', 'mix'], podcast: ['بودكاست'],
            viewFullPlaylist: ['عرض قائمة التشغيل كاملة'], playlist: ['قائمة تشغيل', 'قائمة التشغيل'], tryNow: ['جرّب الآن', 'التجربة الآن'],
            membersOnly: ['مخصّص للأعضاء فقط', 'للأعضاء فقط'], upcoming: ['قريبًا', 'قادم'],
            premierePrefixes: ['عرض أول ', 'العرض الأول '], scheduledPrefixes: ['تم تحديد موعد العرض في ', 'مجدول في '],
            notifyMe: ['تذكيري', 'إشعاري'], downloads: ['عمليات التنزيل', 'التنزيلات'],
            watchLaterActions: ['المشاهدة لاحقًا', 'مشاهدة لاحقًا', 'الحفظ في قائمة المشاهدة لاحقًا'], notInterestedActions: ['لا يهمّني', 'لا يهمني', 'محتوى لا يهمّني'],
            watchLaterLabel: 'المشاهدة لاحقًا', notInterestedLabel: 'لا يهمّني'
        },
        th: {
            playables: ['ฟีเจอร์เล่นเกม'], mix: ['มิกซ์', 'mix'], podcast: ['พอดแคสต์'],
            viewFullPlaylist: ['ดูเพลย์ลิสต์แบบเต็ม'], playlist: ['เพลย์ลิสต์'], tryNow: ['ลองเลย'],
            membersOnly: ['สำหรับสมาชิกเท่านั้น'], upcoming: ['เร็วๆ นี้', 'กำลังจะเผยแพร่'],
            premierePrefixes: ['พรีเมียร์ '], scheduledPrefixes: ['กำหนดเวลาไว้สำหรับ ', 'มีกำหนดการ '],
            notifyMe: ['แจ้งเตือนฉัน', 'ตั้งการช่วยเตือน'], downloads: ['ดาวน์โหลด', 'วิดีโอที่ดาวน์โหลด'],
            watchLaterActions: ['ดูภายหลัง', 'บันทึกไว้ดูภายหลัง', 'บันทึกลงในดูภายหลัง'], notInterestedActions: ['ไม่สนใจ'],
            watchLaterLabel: 'ดูภายหลัง', notInterestedLabel: 'ไม่สนใจ'
        },
        it: {
            playables: ['sala giochi'], mix: ['mix'], podcast: ['podcast'],
            viewFullPlaylist: ['visualizza playlist completa'], playlist: ['playlist'], tryNow: ['prova ora'],
            membersOnly: ['solo per abbonati', 'riservato agli abbonati'], upcoming: ['in arrivo'],
            premierePrefixes: ['premiere ', 'prima visione '], scheduledPrefixes: ['programmato per ', 'in programma per '],
            notifyMe: ['avvisami', 'imposta promemoria'], downloads: ['download'],
            watchLaterActions: ['guarda più tardi', 'salva in guarda più tardi'], notInterestedActions: ['non mi interessa'],
            watchLaterLabel: 'Guarda più tardi', notInterestedLabel: 'Non mi interessa'
        },
        pl: {
            playables: ['pokój gier'], mix: ['mix'], podcast: ['podcast'],
            viewFullPlaylist: ['wyświetl pełną playlistę'], playlist: ['playlista', 'playlistę'], tryNow: ['wypróbuj teraz'],
            membersOnly: ['tylko dla wspierających', 'tylko dla członków'], upcoming: ['wkrótce'],
            premierePrefixes: ['premiera '], scheduledPrefixes: ['zaplanowano na ', 'planowana data '],
            notifyMe: ['powiadom mnie', 'ustaw przypomnienie'], downloads: ['pobrane'],
            watchLaterActions: ['do obejrzenia', 'zapisz na liście do obejrzenia'], notInterestedActions: ['nie interesuje mnie to', 'nie interesuje mnie'],
            watchLaterLabel: 'Do obejrzenia', notInterestedLabel: 'Nie interesuje mnie to'
        },
        uk: {
            playables: ['ігрова кімната'], mix: ['мікс', 'mix'], podcast: ['подкаст'],
            viewFullPlaylist: ['переглянути весь список відтворення'], playlist: ['список відтворення'], tryNow: ['спробувати зараз'],
            membersOnly: ['лише для спонсорів', 'тільки для учасників'], upcoming: ['незабаром', 'очікується'],
            premierePrefixes: ['прем’єра ', "прем'єра "], scheduledPrefixes: ['заплановано на '],
            notifyMe: ['нагадати', 'сповістити мене'], downloads: ['завантаження', 'завантажені відео'],
            watchLaterActions: ['переглянути пізніше', 'зберегти в список «переглянути пізніше»', 'зберегти в список "переглянути пізніше"'], notInterestedActions: ['не цікавить'],
            watchLaterLabel: 'Переглянути пізніше', notInterestedLabel: 'Не цікавить'
        },
        zh_CN: {
            playables: ['游戏大本营'], mix: ['合辑', '混合播放列表', 'mix'], podcast: ['播客', 'podcast'],
            viewFullPlaylist: ['查看完整播放列表'], playlist: ['播放列表'], tryNow: ['立即试用', '立即体验'],
            membersOnly: ['会员专享', '仅限会员'], upcoming: ['即将推出', '即将开始', '即将发布'],
            premierePrefixes: ['首播 '], scheduledPrefixes: ['预定发布时间 ', '定于 '],
            notifyMe: ['通知我', '设置提醒'], downloads: ['下载内容', '已下载的视频'],
            watchLaterActions: ['稍后观看', '保存到“稍后观看”', '保存至“稍后观看”'], notInterestedActions: ['不感兴趣'],
            watchLaterLabel: '稍后观看', notInterestedLabel: '不感兴趣'
        },
        zh_TW: {
            playables: ['遊戲角落'], mix: ['合輯', 'mix'], podcast: ['podcast', '播客'],
            viewFullPlaylist: ['查看完整播放清單'], playlist: ['播放清單'], tryNow: ['立即試用'],
            membersOnly: ['會員限定', '僅限會員'], upcoming: ['即將推出', '即將開始'],
            premierePrefixes: ['首播 '], scheduledPrefixes: ['預定發布時間 ', '預定於 '],
            notifyMe: ['通知我', '設定提醒'], downloads: ['下載內容', '已下載的影片'],
            watchLaterActions: ['稍後觀看', '儲存至「稍後觀看」'], notInterestedActions: ['不感興趣'],
            watchLaterLabel: '稍後觀看', notInterestedLabel: '不感興趣'
        },
        zh_HK: {
            playables: ['playables'], mix: ['合輯', 'mix'], podcast: ['podcast', '播客'],
            viewFullPlaylist: ['查看完整播放清單'], playlist: ['播放清單'], tryNow: ['立即試用'],
            membersOnly: ['會員專享', '會員限定', '僅限會員'], upcoming: ['即將推出', '即將開始'],
            premierePrefixes: ['首播 '], scheduledPrefixes: ['預定發布時間 ', '定於 '],
            notifyMe: ['通知我', '設定提醒'], downloads: ['下載內容', '已下載的影片'],
            watchLaterActions: ['稍後觀看', '儲存至「稍後觀看」'], notInterestedActions: ['不感興趣'],
            watchLaterLabel: '稍後觀看', notInterestedLabel: '不感興趣'
        }
    });

    function normalizeLocale(locale) {
        const normalized = String(locale || '').replace('_', '-').toLowerCase();
        if (normalized === 'pt-br' || normalized.startsWith('pt-br-')) return 'pt_BR';
        if (normalized === 'pt' || normalized === 'pt-pt' || normalized.startsWith('pt-pt-')) return 'pt_PT';
        if (normalized === 'zh-hk' || normalized.startsWith('zh-hk-')
            || normalized === 'zh-mo' || normalized.startsWith('zh-mo-')
            || normalized === 'zh-hant-hk' || normalized.startsWith('zh-hant-hk-')
            || normalized === 'zh-hant-mo' || normalized.startsWith('zh-hant-mo-')) return 'zh_HK';
        if (normalized === 'zh-tw' || normalized.startsWith('zh-tw-')
            || normalized === 'zh-hant' || normalized === 'zh-hant-tw' || normalized.startsWith('zh-hant-tw-')) return 'zh_TW';
        if (normalized === 'zh' || normalized === 'zh-cn' || normalized.startsWith('zh-cn-')
            || normalized === 'zh-sg' || normalized.startsWith('zh-sg-')
            || normalized === 'zh-hans' || normalized.startsWith('zh-hans-')) return 'zh_CN';
        const base = normalized.split('-')[0];
        return Object.prototype.hasOwnProperty.call(localeTerms, base) ? base : 'en';
    }

    function normalizeText(value) {
        return String(value || '').normalize('NFKC').replace(/İ/g, 'i').trim().toLocaleLowerCase().replace(/\s+/g, ' ');
    }

    function getTerms(locale) {
        return localeTerms[normalizeLocale(locale)] || localeTerms.en;
    }

    function matchesAny(value, aliases, mode = 'exact') {
        const normalizedValue = normalizeText(value);
        if (!normalizedValue) return false;
        return aliases.some(alias => {
            const normalizedAlias = normalizeText(alias);
            return mode === 'prefix'
                ? normalizedValue.startsWith(normalizedAlias)
                : mode === 'contains'
                    ? normalizedValue.includes(normalizedAlias)
                    : normalizedValue === normalizedAlias;
        });
    }

    function resolvePageLocale(documentElement = global.document?.documentElement) {
        return normalizeLocale(documentElement?.lang || 'en');
    }

    global.YouTubeUICleanerLocales = Object.freeze({
        localeTerms,
        normalizeLocale,
        normalizeText,
        getTerms,
        matchesAny,
        resolvePageLocale
    });
})(globalThis);
