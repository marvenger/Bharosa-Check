// Rule data only. To add a rule: add an object here + its text in locales/*.js. No other code changes.
// Patterns cover English, Hindi (Devanagari) and Hinglish. `neg` = ignore when negated ("no scheme can guarantee").
export const RULES=[
{id:'guarantee',w:30,neg:1,re:/guarantee\w*|assured (return|profit)s?|fixed returns?|risk[- ]?free|zero risk|no risk|100% (profit|accuracy|sure|safe)|sure[- ]?shot|गारंटी|पक्का (मुनाफ़ा|मुनाफा|रिटर्न|प्रॉफिट)|pakka (profit|return|munafa)|100% (पक्का|सही)/gi},
{id:'unreal',w:25,re:/\b\d{2,3}\s*%[^.\n]{0,30}?(daily|weekly|monthly|per (day|week|month)|every (day|week|month)|हर (दिन|हफ्ते|महीने)|प्रति (दिन|सप्ताह|माह)|har (din|hafte|mahine))|double (your )?money|\b\d{1,2}x (returns?|profit)|दोगुना|double paisa/gi},
{id:'rush',w:15,re:/today only|limited (seats|slots|time|offer)|only \d+ (seats|slots|spots)|last chance|hurry|act now|join (now|today|fast)|expires? (today|soon)|within \d+ (hours?|minutes?)|सिर्फ आज|सीमित सीट|जल्दी (करें|कीजिए)|jaldi (karo|kare)/gi},
{id:'app',w:30,re:/\.apk\b|anydesk|teamviewer|quick ?support|rustdesk|screen ?shar\w*|(install|download)\s+(this |our |the |my )?(app|apk|software)|(ऐप|एप|ऐप्प)\s*(डाउनलोड|इंस्टॉल)/gi},
{id:'fee',w:25,re:/(pay|send|deposit|transfer)[^.\n]{0,40}(fee|charges?|tax|deposit|margin)|(fee|charges?|tax)[^.\n]{0,25}(to (release|unlock|withdraw)|before withdraw)|(फीस|शुल्क|टैक्स|चार्ज)[^.\n]{0,40}(भेजें|जमा|दें|भरें)|fees?\s*(bhejo|jama)/gi},
{id:'upi',w:20,re:/[\w.\-]{2,}@(ybl|ibl|axl|okaxis|okhdfcbank|oksbi|okicici|paytm|apl)\b/gi},
{id:'otp',w:35,re:/(?<!never |not |n't )(send|share|give|tell|forward) (us |me |your |the )?(otp|pin|cvv|password)|ओटीपी (बताएं|भेजें|शेयर)|otp (batao|bhejo)/gi},
{id:'group',w:12,re:/(whatsapp|telegram)\s+(group|channel)|\bvip\b|premium (group|tips?|calls?)|t\.me\/|chat\.whatsapp\.com|wa\.me\/|ग्रुप जॉइन/gi},
{id:'tip',w:15,re:/(buy|sell) (above|below|at|call)|target\s*(price|:)|stop[- ]?loss|jackpot|multibagger|operator|insider|upper circuit/gi},
{id:'approval',w:20,neg:1,re:/(sebi|nse|bse|rbi|government)[ -](approved|certified|authori[sz]ed|official|backed)|सेबी\s*(से\s*)?(मान्यता|प्रमाणित)/gi},
{id:'secret',w:15,re:/don'?t tell|do not tell|keep (this |it )?(a )?(secret|confidential)|tell no one|किसी को (मत|न) बताना?|kisi ko mat batana/gi},
{id:'blocked',w:30,re:/(withdraw\w*|funds?|money)[^.\n]{0,30}(blocked|frozen|stuck|on hold)|recover (your |the )?(lost |stuck )?(money|funds)|fund recovery|get your money back|(पैसा|रकम|निकासी)[^.\n]{0,30}(ब्लॉक|रुक|फ्रीज)/gi},
{id:'proof',w:12,re:/\bI (made|earned|booked)\b[^.\n]{0,12}\d[\d,]{3,}|profit (of|booked)\s*(rs\.?|₹)?\s*\d[\d,]{3,}|मैंने[^.\n]{0,15}कमाए/gi}];
// Small demo list of official broker/exchange domains. Extend via pull request.
export const BRANDS={zerodha:'zerodha.com',groww:'groww.in',upstox:'upstox.com',angelone:'angelone.in',icicidirect:'icicidirect.com',hdfcsec:'hdfcsec.com',kotaksecurities:'kotaksecurities.com','5paisa':'5paisa.com',sharekhan:'sharekhan.com',paytmmoney:'paytmmoney.com',nseindia:'nseindia.com',bseindia:'bseindia.com',sebi:'sebi.gov.in',motilaloswal:'motilaloswal.com'};
export const BADTLD=/\.(xyz|top|vip|club|site|online|icu|cc|live|buzz|shop|click|link)$/;
export const SHORT=/^(bit\.ly|tinyurl\.com|cutt\.ly|rb\.gy|t\.co|is\.gd|shorturl\.at)$/;
// SEBI "@valid" UPI handles (e.g. name.brk@validbank) are issued only to registered intermediaries.
export const VALID=/[\w.\-]+@valid\w*/gi;
