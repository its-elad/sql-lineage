
import * as antlr from "antlr4ng";
import { Token } from "antlr4ng";


export class SqlBaseLexer extends antlr.Lexer {
    public static readonly T__0 = 1;
    public static readonly T__1 = 2;
    public static readonly T__2 = 3;
    public static readonly T__3 = 4;
    public static readonly T__4 = 5;
    public static readonly T__5 = 6;
    public static readonly T__6 = 7;
    public static readonly T__7 = 8;
    public static readonly T__8 = 9;
    public static readonly T__9 = 10;
    public static readonly T__10 = 11;
    public static readonly T__11 = 12;
    public static readonly T__12 = 13;
    public static readonly T__13 = 14;
    public static readonly T__14 = 15;
    public static readonly T__15 = 16;
    public static readonly T__16 = 17;
    public static readonly T__17 = 18;
    public static readonly ABSENT = 19;
    public static readonly ADD = 20;
    public static readonly ADMIN = 21;
    public static readonly AFTER = 22;
    public static readonly ALL = 23;
    public static readonly ALTER = 24;
    public static readonly ANALYZE = 25;
    public static readonly AND = 26;
    public static readonly ANY = 27;
    public static readonly ARRAY = 28;
    public static readonly AS = 29;
    public static readonly ASC = 30;
    public static readonly AT = 31;
    public static readonly AUTHORIZATION = 32;
    public static readonly AUTO = 33;
    public static readonly BEGIN = 34;
    public static readonly BERNOULLI = 35;
    public static readonly BETWEEN = 36;
    public static readonly BOTH = 37;
    public static readonly BRANCH = 38;
    public static readonly BRANCHES = 39;
    public static readonly BY = 40;
    public static readonly CALL = 41;
    public static readonly CALLED = 42;
    public static readonly CASCADE = 43;
    public static readonly CASE = 44;
    public static readonly CAST = 45;
    public static readonly CATALOG = 46;
    public static readonly CATALOGS = 47;
    public static readonly COLUMN = 48;
    public static readonly COLUMNS = 49;
    public static readonly COMMENT = 50;
    public static readonly COMMIT = 51;
    public static readonly COMMITTED = 52;
    public static readonly CONDITIONAL = 53;
    public static readonly CONSTRAINT = 54;
    public static readonly COUNT = 55;
    public static readonly COPARTITION = 56;
    public static readonly CORRESPONDING = 57;
    public static readonly CREATE = 58;
    public static readonly CROSS = 59;
    public static readonly CUBE = 60;
    public static readonly CURRENT = 61;
    public static readonly CURRENT_CATALOG = 62;
    public static readonly CURRENT_DATE = 63;
    public static readonly CURRENT_PATH = 64;
    public static readonly CURRENT_ROLE = 65;
    public static readonly CURRENT_SCHEMA = 66;
    public static readonly CURRENT_TIME = 67;
    public static readonly CURRENT_TIMESTAMP = 68;
    public static readonly CURRENT_USER = 69;
    public static readonly DATA = 70;
    public static readonly DATE = 71;
    public static readonly DAY = 72;
    public static readonly DEALLOCATE = 73;
    public static readonly DECLARE = 74;
    public static readonly DEFAULT = 75;
    public static readonly DEFINE = 76;
    public static readonly DEFINER = 77;
    public static readonly DELETE = 78;
    public static readonly DENY = 79;
    public static readonly DESC = 80;
    public static readonly DESCRIBE = 81;
    public static readonly DESCRIPTOR = 82;
    public static readonly DETERMINISTIC = 83;
    public static readonly DISTINCT = 84;
    public static readonly DISTRIBUTED = 85;
    public static readonly DO = 86;
    public static readonly DOUBLE = 87;
    public static readonly DROP = 88;
    public static readonly ELSE = 89;
    public static readonly EMPTY = 90;
    public static readonly ELSEIF = 91;
    public static readonly ENCODING = 92;
    public static readonly END = 93;
    public static readonly ERROR = 94;
    public static readonly ESCAPE = 95;
    public static readonly EXCEPT = 96;
    public static readonly EXCLUDING = 97;
    public static readonly EXECUTE = 98;
    public static readonly EXISTS = 99;
    public static readonly EXPLAIN = 100;
    public static readonly EXTRACT = 101;
    public static readonly FAIL = 102;
    public static readonly FALSE = 103;
    public static readonly FAST = 104;
    public static readonly FETCH = 105;
    public static readonly FILTER = 106;
    public static readonly FINAL = 107;
    public static readonly FIRST = 108;
    public static readonly FOLLOWING = 109;
    public static readonly FOR = 110;
    public static readonly FORMAT = 111;
    public static readonly FORWARD = 112;
    public static readonly FROM = 113;
    public static readonly FULL = 114;
    public static readonly FUNCTION = 115;
    public static readonly FUNCTIONS = 116;
    public static readonly GRACE = 117;
    public static readonly GRANT = 118;
    public static readonly GRANTED = 119;
    public static readonly GRANTS = 120;
    public static readonly GRAPHVIZ = 121;
    public static readonly GROUP = 122;
    public static readonly GROUPING = 123;
    public static readonly GROUPS = 124;
    public static readonly HAVING = 125;
    public static readonly HOUR = 126;
    public static readonly IF = 127;
    public static readonly IGNORE = 128;
    public static readonly IMMEDIATE = 129;
    public static readonly IN = 130;
    public static readonly INCLUDING = 131;
    public static readonly INITIAL = 132;
    public static readonly INLINE = 133;
    public static readonly INNER = 134;
    public static readonly INPUT = 135;
    public static readonly INSERT = 136;
    public static readonly INTERSECT = 137;
    public static readonly INTERVAL = 138;
    public static readonly INTO = 139;
    public static readonly INVOKER = 140;
    public static readonly IO = 141;
    public static readonly IS = 142;
    public static readonly ISOLATION = 143;
    public static readonly ITERATE = 144;
    public static readonly JOIN = 145;
    public static readonly JSON = 146;
    public static readonly JSON_ARRAY = 147;
    public static readonly JSON_EXISTS = 148;
    public static readonly JSON_OBJECT = 149;
    public static readonly JSON_QUERY = 150;
    public static readonly JSON_TABLE = 151;
    public static readonly JSON_VALUE = 152;
    public static readonly KEEP = 153;
    public static readonly KEY = 154;
    public static readonly KEYS = 155;
    public static readonly LANGUAGE = 156;
    public static readonly LAST = 157;
    public static readonly LATERAL = 158;
    public static readonly LEADING = 159;
    public static readonly LEAVE = 160;
    public static readonly LEFT = 161;
    public static readonly LEVEL = 162;
    public static readonly LIKE = 163;
    public static readonly LIMIT = 164;
    public static readonly LISTAGG = 165;
    public static readonly LOCAL = 166;
    public static readonly LOCALTIME = 167;
    public static readonly LOCALTIMESTAMP = 168;
    public static readonly LOGICAL = 169;
    public static readonly LOOP = 170;
    public static readonly MAP = 171;
    public static readonly MATCH = 172;
    public static readonly MATCHED = 173;
    public static readonly MATCHES = 174;
    public static readonly MATCH_RECOGNIZE = 175;
    public static readonly MATERIALIZED = 176;
    public static readonly MEASURES = 177;
    public static readonly MERGE = 178;
    public static readonly MINUTE = 179;
    public static readonly MONTH = 180;
    public static readonly NATURAL = 181;
    public static readonly NESTED = 182;
    public static readonly NEXT = 183;
    public static readonly NFC = 184;
    public static readonly NFD = 185;
    public static readonly NFKC = 186;
    public static readonly NFKD = 187;
    public static readonly NO = 188;
    public static readonly NONE = 189;
    public static readonly NORMALIZE = 190;
    public static readonly NOT = 191;
    public static readonly NULL = 192;
    public static readonly NULLIF = 193;
    public static readonly NULLS = 194;
    public static readonly OBJECT = 195;
    public static readonly OF = 196;
    public static readonly OFFSET = 197;
    public static readonly OMIT = 198;
    public static readonly ON = 199;
    public static readonly ONE = 200;
    public static readonly ONLY = 201;
    public static readonly OPTION = 202;
    public static readonly OR = 203;
    public static readonly ORDER = 204;
    public static readonly ORDINALITY = 205;
    public static readonly OUTER = 206;
    public static readonly OUTPUT = 207;
    public static readonly OVER = 208;
    public static readonly OVERFLOW = 209;
    public static readonly PARTITION = 210;
    public static readonly PARTITIONS = 211;
    public static readonly PASSING = 212;
    public static readonly PAST = 213;
    public static readonly PATH = 214;
    public static readonly PATTERN = 215;
    public static readonly PER = 216;
    public static readonly PERIOD = 217;
    public static readonly PERMUTE = 218;
    public static readonly PLAN = 219;
    public static readonly POSITION = 220;
    public static readonly PRECEDING = 221;
    public static readonly PRECISION = 222;
    public static readonly PREPARE = 223;
    public static readonly PRIVILEGES = 224;
    public static readonly PROPERTIES = 225;
    public static readonly PRUNE = 226;
    public static readonly QUOTES = 227;
    public static readonly RANGE = 228;
    public static readonly READ = 229;
    public static readonly RECURSIVE = 230;
    public static readonly REFRESH = 231;
    public static readonly RENAME = 232;
    public static readonly REPEAT = 233;
    public static readonly REPEATABLE = 234;
    public static readonly REPLACE = 235;
    public static readonly RESET = 236;
    public static readonly RESPECT = 237;
    public static readonly RESTRICT = 238;
    public static readonly RETURN = 239;
    public static readonly RETURNING = 240;
    public static readonly RETURNS = 241;
    public static readonly REVOKE = 242;
    public static readonly RIGHT = 243;
    public static readonly ROLE = 244;
    public static readonly ROLES = 245;
    public static readonly ROLLBACK = 246;
    public static readonly ROLLUP = 247;
    public static readonly ROW = 248;
    public static readonly ROWS = 249;
    public static readonly RUNNING = 250;
    public static readonly SCALAR = 251;
    public static readonly SCHEMA = 252;
    public static readonly SCHEMAS = 253;
    public static readonly SECOND = 254;
    public static readonly SECURITY = 255;
    public static readonly SEEK = 256;
    public static readonly SELECT = 257;
    public static readonly SERIALIZABLE = 258;
    public static readonly SESSION = 259;
    public static readonly SET = 260;
    public static readonly SETS = 261;
    public static readonly SHOW = 262;
    public static readonly SOME = 263;
    public static readonly STALE = 264;
    public static readonly START = 265;
    public static readonly STATS = 266;
    public static readonly SUBSET = 267;
    public static readonly SUBSTRING = 268;
    public static readonly SYSTEM = 269;
    public static readonly TABLE = 270;
    public static readonly TABLES = 271;
    public static readonly TABLESAMPLE = 272;
    public static readonly TEXT = 273;
    public static readonly TEXT_STRING = 274;
    public static readonly THEN = 275;
    public static readonly TIES = 276;
    public static readonly TIME = 277;
    public static readonly TIMESTAMP = 278;
    public static readonly TO = 279;
    public static readonly TRAILING = 280;
    public static readonly TRANSACTION = 281;
    public static readonly TRIM = 282;
    public static readonly TRUE = 283;
    public static readonly TRUNCATE = 284;
    public static readonly TRY_CAST = 285;
    public static readonly TYPE = 286;
    public static readonly UESCAPE = 287;
    public static readonly UNBOUNDED = 288;
    public static readonly UNCOMMITTED = 289;
    public static readonly UNCONDITIONAL = 290;
    public static readonly UNION = 291;
    public static readonly UNIQUE = 292;
    public static readonly UNKNOWN = 293;
    public static readonly UNMATCHED = 294;
    public static readonly UNNEST = 295;
    public static readonly UNTIL = 296;
    public static readonly UPDATE = 297;
    public static readonly USE = 298;
    public static readonly USER = 299;
    public static readonly USING = 300;
    public static readonly UTF16 = 301;
    public static readonly UTF32 = 302;
    public static readonly UTF8 = 303;
    public static readonly VALIDATE = 304;
    public static readonly VALUE = 305;
    public static readonly VALUES = 306;
    public static readonly VERBOSE = 307;
    public static readonly VERSION = 308;
    public static readonly VIEW = 309;
    public static readonly WHEN = 310;
    public static readonly WHERE = 311;
    public static readonly WHILE = 312;
    public static readonly WINDOW = 313;
    public static readonly WITH = 314;
    public static readonly WITHIN = 315;
    public static readonly WITHOUT = 316;
    public static readonly WORK = 317;
    public static readonly WRAPPER = 318;
    public static readonly WRITE = 319;
    public static readonly YEAR = 320;
    public static readonly ZONE = 321;
    public static readonly EQ = 322;
    public static readonly NEQ = 323;
    public static readonly LT = 324;
    public static readonly LTE = 325;
    public static readonly GT = 326;
    public static readonly GTE = 327;
    public static readonly PLUS = 328;
    public static readonly MINUS = 329;
    public static readonly ASTERISK = 330;
    public static readonly SLASH = 331;
    public static readonly PERCENT = 332;
    public static readonly CONCAT = 333;
    public static readonly QUESTION_MARK = 334;
    public static readonly SEMICOLON = 335;
    public static readonly STRING = 336;
    public static readonly UNICODE_STRING = 337;
    public static readonly DOLLAR_STRING = 338;
    public static readonly BINARY_LITERAL = 339;
    public static readonly INTEGER_VALUE = 340;
    public static readonly DECIMAL_VALUE = 341;
    public static readonly DOUBLE_VALUE = 342;
    public static readonly IDENTIFIER = 343;
    public static readonly DIGIT_IDENTIFIER = 344;
    public static readonly QUOTED_IDENTIFIER = 345;
    public static readonly BACKQUOTED_IDENTIFIER = 346;
    public static readonly SIMPLE_COMMENT = 347;
    public static readonly BRACKETED_COMMENT = 348;
    public static readonly WS = 349;
    public static readonly UNRECOGNIZED = 350;

    public static readonly channelNames = [
        "DEFAULT_TOKEN_CHANNEL", "HIDDEN"
    ];

    public static readonly literalNames = [
        null, "'.'", "'('", "')'", "','", "'@'", "'SKIP'", "'=>'", "'->'", 
        "'['", "']'", "':'", "'|'", "'^'", "'$'", "'{-'", "'-}'", "'{'", 
        "'}'", "'ABSENT'", "'ADD'", "'ADMIN'", "'AFTER'", "'ALL'", "'ALTER'", 
        "'ANALYZE'", "'AND'", "'ANY'", "'ARRAY'", "'AS'", "'ASC'", "'AT'", 
        "'AUTHORIZATION'", "'AUTO'", "'BEGIN'", "'BERNOULLI'", "'BETWEEN'", 
        "'BOTH'", "'BRANCH'", "'BRANCHES'", "'BY'", "'CALL'", "'CALLED'", 
        "'CASCADE'", "'CASE'", "'CAST'", "'CATALOG'", "'CATALOGS'", "'COLUMN'", 
        "'COLUMNS'", "'COMMENT'", "'COMMIT'", "'COMMITTED'", "'CONDITIONAL'", 
        "'CONSTRAINT'", "'COUNT'", "'COPARTITION'", "'CORRESPONDING'", "'CREATE'", 
        "'CROSS'", "'CUBE'", "'CURRENT'", "'CURRENT_CATALOG'", "'CURRENT_DATE'", 
        "'CURRENT_PATH'", "'CURRENT_ROLE'", "'CURRENT_SCHEMA'", "'CURRENT_TIME'", 
        "'CURRENT_TIMESTAMP'", "'CURRENT_USER'", "'DATA'", "'DATE'", "'DAY'", 
        "'DEALLOCATE'", "'DECLARE'", "'DEFAULT'", "'DEFINE'", "'DEFINER'", 
        "'DELETE'", "'DENY'", "'DESC'", "'DESCRIBE'", "'DESCRIPTOR'", "'DETERMINISTIC'", 
        "'DISTINCT'", "'DISTRIBUTED'", "'DO'", "'DOUBLE'", "'DROP'", "'ELSE'", 
        "'EMPTY'", "'ELSEIF'", "'ENCODING'", "'END'", "'ERROR'", "'ESCAPE'", 
        "'EXCEPT'", "'EXCLUDING'", "'EXECUTE'", "'EXISTS'", "'EXPLAIN'", 
        "'EXTRACT'", "'FAIL'", "'FALSE'", "'FAST'", "'FETCH'", "'FILTER'", 
        "'FINAL'", "'FIRST'", "'FOLLOWING'", "'FOR'", "'FORMAT'", "'FORWARD'", 
        "'FROM'", "'FULL'", "'FUNCTION'", "'FUNCTIONS'", "'GRACE'", "'GRANT'", 
        "'GRANTED'", "'GRANTS'", "'GRAPHVIZ'", "'GROUP'", "'GROUPING'", 
        "'GROUPS'", "'HAVING'", "'HOUR'", "'IF'", "'IGNORE'", "'IMMEDIATE'", 
        "'IN'", "'INCLUDING'", "'INITIAL'", "'INLINE'", "'INNER'", "'INPUT'", 
        "'INSERT'", "'INTERSECT'", "'INTERVAL'", "'INTO'", "'INVOKER'", 
        "'IO'", "'IS'", "'ISOLATION'", "'ITERATE'", "'JOIN'", "'JSON'", 
        "'JSON_ARRAY'", "'JSON_EXISTS'", "'JSON_OBJECT'", "'JSON_QUERY'", 
        "'JSON_TABLE'", "'JSON_VALUE'", "'KEEP'", "'KEY'", "'KEYS'", "'LANGUAGE'", 
        "'LAST'", "'LATERAL'", "'LEADING'", "'LEAVE'", "'LEFT'", "'LEVEL'", 
        "'LIKE'", "'LIMIT'", "'LISTAGG'", "'LOCAL'", "'LOCALTIME'", "'LOCALTIMESTAMP'", 
        "'LOGICAL'", "'LOOP'", "'MAP'", "'MATCH'", "'MATCHED'", "'MATCHES'", 
        "'MATCH_RECOGNIZE'", "'MATERIALIZED'", "'MEASURES'", "'MERGE'", 
        "'MINUTE'", "'MONTH'", "'NATURAL'", "'NESTED'", "'NEXT'", "'NFC'", 
        "'NFD'", "'NFKC'", "'NFKD'", "'NO'", "'NONE'", "'NORMALIZE'", "'NOT'", 
        "'NULL'", "'NULLIF'", "'NULLS'", "'OBJECT'", "'OF'", "'OFFSET'", 
        "'OMIT'", "'ON'", "'ONE'", "'ONLY'", "'OPTION'", "'OR'", "'ORDER'", 
        "'ORDINALITY'", "'OUTER'", "'OUTPUT'", "'OVER'", "'OVERFLOW'", "'PARTITION'", 
        "'PARTITIONS'", "'PASSING'", "'PAST'", "'PATH'", "'PATTERN'", "'PER'", 
        "'PERIOD'", "'PERMUTE'", "'PLAN'", "'POSITION'", "'PRECEDING'", 
        "'PRECISION'", "'PREPARE'", "'PRIVILEGES'", "'PROPERTIES'", "'PRUNE'", 
        "'QUOTES'", "'RANGE'", "'READ'", "'RECURSIVE'", "'REFRESH'", "'RENAME'", 
        "'REPEAT'", "'REPEATABLE'", "'REPLACE'", "'RESET'", "'RESPECT'", 
        "'RESTRICT'", "'RETURN'", "'RETURNING'", "'RETURNS'", "'REVOKE'", 
        "'RIGHT'", "'ROLE'", "'ROLES'", "'ROLLBACK'", "'ROLLUP'", "'ROW'", 
        "'ROWS'", "'RUNNING'", "'SCALAR'", "'SCHEMA'", "'SCHEMAS'", "'SECOND'", 
        "'SECURITY'", "'SEEK'", "'SELECT'", "'SERIALIZABLE'", "'SESSION'", 
        "'SET'", "'SETS'", "'SHOW'", "'SOME'", "'STALE'", "'START'", "'STATS'", 
        "'SUBSET'", "'SUBSTRING'", "'SYSTEM'", "'TABLE'", "'TABLES'", "'TABLESAMPLE'", 
        "'TEXT'", "'STRING'", "'THEN'", "'TIES'", "'TIME'", "'TIMESTAMP'", 
        "'TO'", "'TRAILING'", "'TRANSACTION'", "'TRIM'", "'TRUE'", "'TRUNCATE'", 
        "'TRY_CAST'", "'TYPE'", "'UESCAPE'", "'UNBOUNDED'", "'UNCOMMITTED'", 
        "'UNCONDITIONAL'", "'UNION'", "'UNIQUE'", "'UNKNOWN'", "'UNMATCHED'", 
        "'UNNEST'", "'UNTIL'", "'UPDATE'", "'USE'", "'USER'", "'USING'", 
        "'UTF16'", "'UTF32'", "'UTF8'", "'VALIDATE'", "'VALUE'", "'VALUES'", 
        "'VERBOSE'", "'VERSION'", "'VIEW'", "'WHEN'", "'WHERE'", "'WHILE'", 
        "'WINDOW'", "'WITH'", "'WITHIN'", "'WITHOUT'", "'WORK'", "'WRAPPER'", 
        "'WRITE'", "'YEAR'", "'ZONE'", "'='", null, "'<'", "'<='", "'>'", 
        "'>='", "'+'", "'-'", "'*'", "'/'", "'%'", "'||'", "'?'", "';'"
    ];

    public static readonly symbolicNames = [
        null, null, null, null, null, null, null, null, null, null, null, 
        null, null, null, null, null, null, null, null, "ABSENT", "ADD", 
        "ADMIN", "AFTER", "ALL", "ALTER", "ANALYZE", "AND", "ANY", "ARRAY", 
        "AS", "ASC", "AT", "AUTHORIZATION", "AUTO", "BEGIN", "BERNOULLI", 
        "BETWEEN", "BOTH", "BRANCH", "BRANCHES", "BY", "CALL", "CALLED", 
        "CASCADE", "CASE", "CAST", "CATALOG", "CATALOGS", "COLUMN", "COLUMNS", 
        "COMMENT", "COMMIT", "COMMITTED", "CONDITIONAL", "CONSTRAINT", "COUNT", 
        "COPARTITION", "CORRESPONDING", "CREATE", "CROSS", "CUBE", "CURRENT", 
        "CURRENT_CATALOG", "CURRENT_DATE", "CURRENT_PATH", "CURRENT_ROLE", 
        "CURRENT_SCHEMA", "CURRENT_TIME", "CURRENT_TIMESTAMP", "CURRENT_USER", 
        "DATA", "DATE", "DAY", "DEALLOCATE", "DECLARE", "DEFAULT", "DEFINE", 
        "DEFINER", "DELETE", "DENY", "DESC", "DESCRIBE", "DESCRIPTOR", "DETERMINISTIC", 
        "DISTINCT", "DISTRIBUTED", "DO", "DOUBLE", "DROP", "ELSE", "EMPTY", 
        "ELSEIF", "ENCODING", "END", "ERROR", "ESCAPE", "EXCEPT", "EXCLUDING", 
        "EXECUTE", "EXISTS", "EXPLAIN", "EXTRACT", "FAIL", "FALSE", "FAST", 
        "FETCH", "FILTER", "FINAL", "FIRST", "FOLLOWING", "FOR", "FORMAT", 
        "FORWARD", "FROM", "FULL", "FUNCTION", "FUNCTIONS", "GRACE", "GRANT", 
        "GRANTED", "GRANTS", "GRAPHVIZ", "GROUP", "GROUPING", "GROUPS", 
        "HAVING", "HOUR", "IF", "IGNORE", "IMMEDIATE", "IN", "INCLUDING", 
        "INITIAL", "INLINE", "INNER", "INPUT", "INSERT", "INTERSECT", "INTERVAL", 
        "INTO", "INVOKER", "IO", "IS", "ISOLATION", "ITERATE", "JOIN", "JSON", 
        "JSON_ARRAY", "JSON_EXISTS", "JSON_OBJECT", "JSON_QUERY", "JSON_TABLE", 
        "JSON_VALUE", "KEEP", "KEY", "KEYS", "LANGUAGE", "LAST", "LATERAL", 
        "LEADING", "LEAVE", "LEFT", "LEVEL", "LIKE", "LIMIT", "LISTAGG", 
        "LOCAL", "LOCALTIME", "LOCALTIMESTAMP", "LOGICAL", "LOOP", "MAP", 
        "MATCH", "MATCHED", "MATCHES", "MATCH_RECOGNIZE", "MATERIALIZED", 
        "MEASURES", "MERGE", "MINUTE", "MONTH", "NATURAL", "NESTED", "NEXT", 
        "NFC", "NFD", "NFKC", "NFKD", "NO", "NONE", "NORMALIZE", "NOT", 
        "NULL", "NULLIF", "NULLS", "OBJECT", "OF", "OFFSET", "OMIT", "ON", 
        "ONE", "ONLY", "OPTION", "OR", "ORDER", "ORDINALITY", "OUTER", "OUTPUT", 
        "OVER", "OVERFLOW", "PARTITION", "PARTITIONS", "PASSING", "PAST", 
        "PATH", "PATTERN", "PER", "PERIOD", "PERMUTE", "PLAN", "POSITION", 
        "PRECEDING", "PRECISION", "PREPARE", "PRIVILEGES", "PROPERTIES", 
        "PRUNE", "QUOTES", "RANGE", "READ", "RECURSIVE", "REFRESH", "RENAME", 
        "REPEAT", "REPEATABLE", "REPLACE", "RESET", "RESPECT", "RESTRICT", 
        "RETURN", "RETURNING", "RETURNS", "REVOKE", "RIGHT", "ROLE", "ROLES", 
        "ROLLBACK", "ROLLUP", "ROW", "ROWS", "RUNNING", "SCALAR", "SCHEMA", 
        "SCHEMAS", "SECOND", "SECURITY", "SEEK", "SELECT", "SERIALIZABLE", 
        "SESSION", "SET", "SETS", "SHOW", "SOME", "STALE", "START", "STATS", 
        "SUBSET", "SUBSTRING", "SYSTEM", "TABLE", "TABLES", "TABLESAMPLE", 
        "TEXT", "TEXT_STRING", "THEN", "TIES", "TIME", "TIMESTAMP", "TO", 
        "TRAILING", "TRANSACTION", "TRIM", "TRUE", "TRUNCATE", "TRY_CAST", 
        "TYPE", "UESCAPE", "UNBOUNDED", "UNCOMMITTED", "UNCONDITIONAL", 
        "UNION", "UNIQUE", "UNKNOWN", "UNMATCHED", "UNNEST", "UNTIL", "UPDATE", 
        "USE", "USER", "USING", "UTF16", "UTF32", "UTF8", "VALIDATE", "VALUE", 
        "VALUES", "VERBOSE", "VERSION", "VIEW", "WHEN", "WHERE", "WHILE", 
        "WINDOW", "WITH", "WITHIN", "WITHOUT", "WORK", "WRAPPER", "WRITE", 
        "YEAR", "ZONE", "EQ", "NEQ", "LT", "LTE", "GT", "GTE", "PLUS", "MINUS", 
        "ASTERISK", "SLASH", "PERCENT", "CONCAT", "QUESTION_MARK", "SEMICOLON", 
        "STRING", "UNICODE_STRING", "DOLLAR_STRING", "BINARY_LITERAL", "INTEGER_VALUE", 
        "DECIMAL_VALUE", "DOUBLE_VALUE", "IDENTIFIER", "DIGIT_IDENTIFIER", 
        "QUOTED_IDENTIFIER", "BACKQUOTED_IDENTIFIER", "SIMPLE_COMMENT", 
        "BRACKETED_COMMENT", "WS", "UNRECOGNIZED"
    ];

    public static readonly modeNames = [
        "DEFAULT_MODE",
    ];

    public static readonly ruleNames = [
        "T__0", "T__1", "T__2", "T__3", "T__4", "T__5", "T__6", "T__7", 
        "T__8", "T__9", "T__10", "T__11", "T__12", "T__13", "T__14", "T__15", 
        "T__16", "T__17", "ABSENT", "ADD", "ADMIN", "AFTER", "ALL", "ALTER", 
        "ANALYZE", "AND", "ANY", "ARRAY", "AS", "ASC", "AT", "AUTHORIZATION", 
        "AUTO", "BEGIN", "BERNOULLI", "BETWEEN", "BOTH", "BRANCH", "BRANCHES", 
        "BY", "CALL", "CALLED", "CASCADE", "CASE", "CAST", "CATALOG", "CATALOGS", 
        "COLUMN", "COLUMNS", "COMMENT", "COMMIT", "COMMITTED", "CONDITIONAL", 
        "CONSTRAINT", "COUNT", "COPARTITION", "CORRESPONDING", "CREATE", 
        "CROSS", "CUBE", "CURRENT", "CURRENT_CATALOG", "CURRENT_DATE", "CURRENT_PATH", 
        "CURRENT_ROLE", "CURRENT_SCHEMA", "CURRENT_TIME", "CURRENT_TIMESTAMP", 
        "CURRENT_USER", "DATA", "DATE", "DAY", "DEALLOCATE", "DECLARE", 
        "DEFAULT", "DEFINE", "DEFINER", "DELETE", "DENY", "DESC", "DESCRIBE", 
        "DESCRIPTOR", "DETERMINISTIC", "DISTINCT", "DISTRIBUTED", "DO", 
        "DOUBLE", "DROP", "ELSE", "EMPTY", "ELSEIF", "ENCODING", "END", 
        "ERROR", "ESCAPE", "EXCEPT", "EXCLUDING", "EXECUTE", "EXISTS", "EXPLAIN", 
        "EXTRACT", "FAIL", "FALSE", "FAST", "FETCH", "FILTER", "FINAL", 
        "FIRST", "FOLLOWING", "FOR", "FORMAT", "FORWARD", "FROM", "FULL", 
        "FUNCTION", "FUNCTIONS", "GRACE", "GRANT", "GRANTED", "GRANTS", 
        "GRAPHVIZ", "GROUP", "GROUPING", "GROUPS", "HAVING", "HOUR", "IF", 
        "IGNORE", "IMMEDIATE", "IN", "INCLUDING", "INITIAL", "INLINE", "INNER", 
        "INPUT", "INSERT", "INTERSECT", "INTERVAL", "INTO", "INVOKER", "IO", 
        "IS", "ISOLATION", "ITERATE", "JOIN", "JSON", "JSON_ARRAY", "JSON_EXISTS", 
        "JSON_OBJECT", "JSON_QUERY", "JSON_TABLE", "JSON_VALUE", "KEEP", 
        "KEY", "KEYS", "LANGUAGE", "LAST", "LATERAL", "LEADING", "LEAVE", 
        "LEFT", "LEVEL", "LIKE", "LIMIT", "LISTAGG", "LOCAL", "LOCALTIME", 
        "LOCALTIMESTAMP", "LOGICAL", "LOOP", "MAP", "MATCH", "MATCHED", 
        "MATCHES", "MATCH_RECOGNIZE", "MATERIALIZED", "MEASURES", "MERGE", 
        "MINUTE", "MONTH", "NATURAL", "NESTED", "NEXT", "NFC", "NFD", "NFKC", 
        "NFKD", "NO", "NONE", "NORMALIZE", "NOT", "NULL", "NULLIF", "NULLS", 
        "OBJECT", "OF", "OFFSET", "OMIT", "ON", "ONE", "ONLY", "OPTION", 
        "OR", "ORDER", "ORDINALITY", "OUTER", "OUTPUT", "OVER", "OVERFLOW", 
        "PARTITION", "PARTITIONS", "PASSING", "PAST", "PATH", "PATTERN", 
        "PER", "PERIOD", "PERMUTE", "PLAN", "POSITION", "PRECEDING", "PRECISION", 
        "PREPARE", "PRIVILEGES", "PROPERTIES", "PRUNE", "QUOTES", "RANGE", 
        "READ", "RECURSIVE", "REFRESH", "RENAME", "REPEAT", "REPEATABLE", 
        "REPLACE", "RESET", "RESPECT", "RESTRICT", "RETURN", "RETURNING", 
        "RETURNS", "REVOKE", "RIGHT", "ROLE", "ROLES", "ROLLBACK", "ROLLUP", 
        "ROW", "ROWS", "RUNNING", "SCALAR", "SCHEMA", "SCHEMAS", "SECOND", 
        "SECURITY", "SEEK", "SELECT", "SERIALIZABLE", "SESSION", "SET", 
        "SETS", "SHOW", "SOME", "STALE", "START", "STATS", "SUBSET", "SUBSTRING", 
        "SYSTEM", "TABLE", "TABLES", "TABLESAMPLE", "TEXT", "TEXT_STRING", 
        "THEN", "TIES", "TIME", "TIMESTAMP", "TO", "TRAILING", "TRANSACTION", 
        "TRIM", "TRUE", "TRUNCATE", "TRY_CAST", "TYPE", "UESCAPE", "UNBOUNDED", 
        "UNCOMMITTED", "UNCONDITIONAL", "UNION", "UNIQUE", "UNKNOWN", "UNMATCHED", 
        "UNNEST", "UNTIL", "UPDATE", "USE", "USER", "USING", "UTF16", "UTF32", 
        "UTF8", "VALIDATE", "VALUE", "VALUES", "VERBOSE", "VERSION", "VIEW", 
        "WHEN", "WHERE", "WHILE", "WINDOW", "WITH", "WITHIN", "WITHOUT", 
        "WORK", "WRAPPER", "WRITE", "YEAR", "ZONE", "EQ", "NEQ", "LT", "LTE", 
        "GT", "GTE", "PLUS", "MINUS", "ASTERISK", "SLASH", "PERCENT", "CONCAT", 
        "QUESTION_MARK", "SEMICOLON", "STRING", "UNICODE_STRING", "DOLLAR_STRING", 
        "BINARY_LITERAL", "INTEGER_VALUE", "DECIMAL_VALUE", "DOUBLE_VALUE", 
        "IDENTIFIER", "DIGIT_IDENTIFIER", "QUOTED_IDENTIFIER", "BACKQUOTED_IDENTIFIER", 
        "DECIMAL_INTEGER", "HEXADECIMAL_INTEGER", "OCTAL_INTEGER", "BINARY_INTEGER", 
        "EXPONENT", "DIGIT", "LETTER", "SIMPLE_COMMENT", "BRACKETED_COMMENT", 
        "WS", "UNRECOGNIZED",
    ];


    public constructor(input: antlr.CharStream) {
        super(input);
        this.interpreter = new antlr.LexerATNSimulator(this, SqlBaseLexer._ATN, SqlBaseLexer.decisionsToDFA, new antlr.PredictionContextCache());
    }

    public get grammarFileName(): string { return "SqlBase.g4"; }

    public get literalNames(): (string | null)[] { return SqlBaseLexer.literalNames; }
    public get symbolicNames(): (string | null)[] { return SqlBaseLexer.symbolicNames; }
    public get ruleNames(): string[] { return SqlBaseLexer.ruleNames; }

    public get serializedATN(): number[] { return SqlBaseLexer._serializedATN; }

    public get channelNames(): string[] { return SqlBaseLexer.channelNames; }

    public get modeNames(): string[] { return SqlBaseLexer.modeNames; }

    public static readonly _serializedATN: number[] = [
        4,0,350,3219,6,-1,2,0,7,0,2,1,7,1,2,2,7,2,2,3,7,3,2,4,7,4,2,5,7,
        5,2,6,7,6,2,7,7,7,2,8,7,8,2,9,7,9,2,10,7,10,2,11,7,11,2,12,7,12,
        2,13,7,13,2,14,7,14,2,15,7,15,2,16,7,16,2,17,7,17,2,18,7,18,2,19,
        7,19,2,20,7,20,2,21,7,21,2,22,7,22,2,23,7,23,2,24,7,24,2,25,7,25,
        2,26,7,26,2,27,7,27,2,28,7,28,2,29,7,29,2,30,7,30,2,31,7,31,2,32,
        7,32,2,33,7,33,2,34,7,34,2,35,7,35,2,36,7,36,2,37,7,37,2,38,7,38,
        2,39,7,39,2,40,7,40,2,41,7,41,2,42,7,42,2,43,7,43,2,44,7,44,2,45,
        7,45,2,46,7,46,2,47,7,47,2,48,7,48,2,49,7,49,2,50,7,50,2,51,7,51,
        2,52,7,52,2,53,7,53,2,54,7,54,2,55,7,55,2,56,7,56,2,57,7,57,2,58,
        7,58,2,59,7,59,2,60,7,60,2,61,7,61,2,62,7,62,2,63,7,63,2,64,7,64,
        2,65,7,65,2,66,7,66,2,67,7,67,2,68,7,68,2,69,7,69,2,70,7,70,2,71,
        7,71,2,72,7,72,2,73,7,73,2,74,7,74,2,75,7,75,2,76,7,76,2,77,7,77,
        2,78,7,78,2,79,7,79,2,80,7,80,2,81,7,81,2,82,7,82,2,83,7,83,2,84,
        7,84,2,85,7,85,2,86,7,86,2,87,7,87,2,88,7,88,2,89,7,89,2,90,7,90,
        2,91,7,91,2,92,7,92,2,93,7,93,2,94,7,94,2,95,7,95,2,96,7,96,2,97,
        7,97,2,98,7,98,2,99,7,99,2,100,7,100,2,101,7,101,2,102,7,102,2,103,
        7,103,2,104,7,104,2,105,7,105,2,106,7,106,2,107,7,107,2,108,7,108,
        2,109,7,109,2,110,7,110,2,111,7,111,2,112,7,112,2,113,7,113,2,114,
        7,114,2,115,7,115,2,116,7,116,2,117,7,117,2,118,7,118,2,119,7,119,
        2,120,7,120,2,121,7,121,2,122,7,122,2,123,7,123,2,124,7,124,2,125,
        7,125,2,126,7,126,2,127,7,127,2,128,7,128,2,129,7,129,2,130,7,130,
        2,131,7,131,2,132,7,132,2,133,7,133,2,134,7,134,2,135,7,135,2,136,
        7,136,2,137,7,137,2,138,7,138,2,139,7,139,2,140,7,140,2,141,7,141,
        2,142,7,142,2,143,7,143,2,144,7,144,2,145,7,145,2,146,7,146,2,147,
        7,147,2,148,7,148,2,149,7,149,2,150,7,150,2,151,7,151,2,152,7,152,
        2,153,7,153,2,154,7,154,2,155,7,155,2,156,7,156,2,157,7,157,2,158,
        7,158,2,159,7,159,2,160,7,160,2,161,7,161,2,162,7,162,2,163,7,163,
        2,164,7,164,2,165,7,165,2,166,7,166,2,167,7,167,2,168,7,168,2,169,
        7,169,2,170,7,170,2,171,7,171,2,172,7,172,2,173,7,173,2,174,7,174,
        2,175,7,175,2,176,7,176,2,177,7,177,2,178,7,178,2,179,7,179,2,180,
        7,180,2,181,7,181,2,182,7,182,2,183,7,183,2,184,7,184,2,185,7,185,
        2,186,7,186,2,187,7,187,2,188,7,188,2,189,7,189,2,190,7,190,2,191,
        7,191,2,192,7,192,2,193,7,193,2,194,7,194,2,195,7,195,2,196,7,196,
        2,197,7,197,2,198,7,198,2,199,7,199,2,200,7,200,2,201,7,201,2,202,
        7,202,2,203,7,203,2,204,7,204,2,205,7,205,2,206,7,206,2,207,7,207,
        2,208,7,208,2,209,7,209,2,210,7,210,2,211,7,211,2,212,7,212,2,213,
        7,213,2,214,7,214,2,215,7,215,2,216,7,216,2,217,7,217,2,218,7,218,
        2,219,7,219,2,220,7,220,2,221,7,221,2,222,7,222,2,223,7,223,2,224,
        7,224,2,225,7,225,2,226,7,226,2,227,7,227,2,228,7,228,2,229,7,229,
        2,230,7,230,2,231,7,231,2,232,7,232,2,233,7,233,2,234,7,234,2,235,
        7,235,2,236,7,236,2,237,7,237,2,238,7,238,2,239,7,239,2,240,7,240,
        2,241,7,241,2,242,7,242,2,243,7,243,2,244,7,244,2,245,7,245,2,246,
        7,246,2,247,7,247,2,248,7,248,2,249,7,249,2,250,7,250,2,251,7,251,
        2,252,7,252,2,253,7,253,2,254,7,254,2,255,7,255,2,256,7,256,2,257,
        7,257,2,258,7,258,2,259,7,259,2,260,7,260,2,261,7,261,2,262,7,262,
        2,263,7,263,2,264,7,264,2,265,7,265,2,266,7,266,2,267,7,267,2,268,
        7,268,2,269,7,269,2,270,7,270,2,271,7,271,2,272,7,272,2,273,7,273,
        2,274,7,274,2,275,7,275,2,276,7,276,2,277,7,277,2,278,7,278,2,279,
        7,279,2,280,7,280,2,281,7,281,2,282,7,282,2,283,7,283,2,284,7,284,
        2,285,7,285,2,286,7,286,2,287,7,287,2,288,7,288,2,289,7,289,2,290,
        7,290,2,291,7,291,2,292,7,292,2,293,7,293,2,294,7,294,2,295,7,295,
        2,296,7,296,2,297,7,297,2,298,7,298,2,299,7,299,2,300,7,300,2,301,
        7,301,2,302,7,302,2,303,7,303,2,304,7,304,2,305,7,305,2,306,7,306,
        2,307,7,307,2,308,7,308,2,309,7,309,2,310,7,310,2,311,7,311,2,312,
        7,312,2,313,7,313,2,314,7,314,2,315,7,315,2,316,7,316,2,317,7,317,
        2,318,7,318,2,319,7,319,2,320,7,320,2,321,7,321,2,322,7,322,2,323,
        7,323,2,324,7,324,2,325,7,325,2,326,7,326,2,327,7,327,2,328,7,328,
        2,329,7,329,2,330,7,330,2,331,7,331,2,332,7,332,2,333,7,333,2,334,
        7,334,2,335,7,335,2,336,7,336,2,337,7,337,2,338,7,338,2,339,7,339,
        2,340,7,340,2,341,7,341,2,342,7,342,2,343,7,343,2,344,7,344,2,345,
        7,345,2,346,7,346,2,347,7,347,2,348,7,348,2,349,7,349,2,350,7,350,
        2,351,7,351,2,352,7,352,2,353,7,353,2,354,7,354,2,355,7,355,2,356,
        7,356,1,0,1,0,1,1,1,1,1,2,1,2,1,3,1,3,1,4,1,4,1,5,1,5,1,5,1,5,1,
        5,1,6,1,6,1,6,1,7,1,7,1,7,1,8,1,8,1,9,1,9,1,10,1,10,1,11,1,11,1,
        12,1,12,1,13,1,13,1,14,1,14,1,14,1,15,1,15,1,15,1,16,1,16,1,17,1,
        17,1,18,1,18,1,18,1,18,1,18,1,18,1,18,1,19,1,19,1,19,1,19,1,20,1,
        20,1,20,1,20,1,20,1,20,1,21,1,21,1,21,1,21,1,21,1,21,1,22,1,22,1,
        22,1,22,1,23,1,23,1,23,1,23,1,23,1,23,1,24,1,24,1,24,1,24,1,24,1,
        24,1,24,1,24,1,25,1,25,1,25,1,25,1,26,1,26,1,26,1,26,1,27,1,27,1,
        27,1,27,1,27,1,27,1,28,1,28,1,28,1,29,1,29,1,29,1,29,1,30,1,30,1,
        30,1,31,1,31,1,31,1,31,1,31,1,31,1,31,1,31,1,31,1,31,1,31,1,31,1,
        31,1,31,1,32,1,32,1,32,1,32,1,32,1,33,1,33,1,33,1,33,1,33,1,33,1,
        34,1,34,1,34,1,34,1,34,1,34,1,34,1,34,1,34,1,34,1,35,1,35,1,35,1,
        35,1,35,1,35,1,35,1,35,1,36,1,36,1,36,1,36,1,36,1,37,1,37,1,37,1,
        37,1,37,1,37,1,37,1,38,1,38,1,38,1,38,1,38,1,38,1,38,1,38,1,38,1,
        39,1,39,1,39,1,40,1,40,1,40,1,40,1,40,1,41,1,41,1,41,1,41,1,41,1,
        41,1,41,1,42,1,42,1,42,1,42,1,42,1,42,1,42,1,42,1,43,1,43,1,43,1,
        43,1,43,1,44,1,44,1,44,1,44,1,44,1,45,1,45,1,45,1,45,1,45,1,45,1,
        45,1,45,1,46,1,46,1,46,1,46,1,46,1,46,1,46,1,46,1,46,1,47,1,47,1,
        47,1,47,1,47,1,47,1,47,1,48,1,48,1,48,1,48,1,48,1,48,1,48,1,48,1,
        49,1,49,1,49,1,49,1,49,1,49,1,49,1,49,1,50,1,50,1,50,1,50,1,50,1,
        50,1,50,1,51,1,51,1,51,1,51,1,51,1,51,1,51,1,51,1,51,1,51,1,52,1,
        52,1,52,1,52,1,52,1,52,1,52,1,52,1,52,1,52,1,52,1,52,1,53,1,53,1,
        53,1,53,1,53,1,53,1,53,1,53,1,53,1,53,1,53,1,54,1,54,1,54,1,54,1,
        54,1,54,1,55,1,55,1,55,1,55,1,55,1,55,1,55,1,55,1,55,1,55,1,55,1,
        55,1,56,1,56,1,56,1,56,1,56,1,56,1,56,1,56,1,56,1,56,1,56,1,56,1,
        56,1,56,1,57,1,57,1,57,1,57,1,57,1,57,1,57,1,58,1,58,1,58,1,58,1,
        58,1,58,1,59,1,59,1,59,1,59,1,59,1,60,1,60,1,60,1,60,1,60,1,60,1,
        60,1,60,1,61,1,61,1,61,1,61,1,61,1,61,1,61,1,61,1,61,1,61,1,61,1,
        61,1,61,1,61,1,61,1,61,1,62,1,62,1,62,1,62,1,62,1,62,1,62,1,62,1,
        62,1,62,1,62,1,62,1,62,1,63,1,63,1,63,1,63,1,63,1,63,1,63,1,63,1,
        63,1,63,1,63,1,63,1,63,1,64,1,64,1,64,1,64,1,64,1,64,1,64,1,64,1,
        64,1,64,1,64,1,64,1,64,1,65,1,65,1,65,1,65,1,65,1,65,1,65,1,65,1,
        65,1,65,1,65,1,65,1,65,1,65,1,65,1,66,1,66,1,66,1,66,1,66,1,66,1,
        66,1,66,1,66,1,66,1,66,1,66,1,66,1,67,1,67,1,67,1,67,1,67,1,67,1,
        67,1,67,1,67,1,67,1,67,1,67,1,67,1,67,1,67,1,67,1,67,1,67,1,68,1,
        68,1,68,1,68,1,68,1,68,1,68,1,68,1,68,1,68,1,68,1,68,1,68,1,69,1,
        69,1,69,1,69,1,69,1,70,1,70,1,70,1,70,1,70,1,71,1,71,1,71,1,71,1,
        72,1,72,1,72,1,72,1,72,1,72,1,72,1,72,1,72,1,72,1,72,1,73,1,73,1,
        73,1,73,1,73,1,73,1,73,1,73,1,74,1,74,1,74,1,74,1,74,1,74,1,74,1,
        74,1,75,1,75,1,75,1,75,1,75,1,75,1,75,1,76,1,76,1,76,1,76,1,76,1,
        76,1,76,1,76,1,77,1,77,1,77,1,77,1,77,1,77,1,77,1,78,1,78,1,78,1,
        78,1,78,1,79,1,79,1,79,1,79,1,79,1,80,1,80,1,80,1,80,1,80,1,80,1,
        80,1,80,1,80,1,81,1,81,1,81,1,81,1,81,1,81,1,81,1,81,1,81,1,81,1,
        81,1,82,1,82,1,82,1,82,1,82,1,82,1,82,1,82,1,82,1,82,1,82,1,82,1,
        82,1,82,1,83,1,83,1,83,1,83,1,83,1,83,1,83,1,83,1,83,1,84,1,84,1,
        84,1,84,1,84,1,84,1,84,1,84,1,84,1,84,1,84,1,84,1,85,1,85,1,85,1,
        86,1,86,1,86,1,86,1,86,1,86,1,86,1,87,1,87,1,87,1,87,1,87,1,88,1,
        88,1,88,1,88,1,88,1,89,1,89,1,89,1,89,1,89,1,89,1,90,1,90,1,90,1,
        90,1,90,1,90,1,90,1,91,1,91,1,91,1,91,1,91,1,91,1,91,1,91,1,91,1,
        92,1,92,1,92,1,92,1,93,1,93,1,93,1,93,1,93,1,93,1,94,1,94,1,94,1,
        94,1,94,1,94,1,94,1,95,1,95,1,95,1,95,1,95,1,95,1,95,1,96,1,96,1,
        96,1,96,1,96,1,96,1,96,1,96,1,96,1,96,1,97,1,97,1,97,1,97,1,97,1,
        97,1,97,1,97,1,98,1,98,1,98,1,98,1,98,1,98,1,98,1,99,1,99,1,99,1,
        99,1,99,1,99,1,99,1,99,1,100,1,100,1,100,1,100,1,100,1,100,1,100,
        1,100,1,101,1,101,1,101,1,101,1,101,1,102,1,102,1,102,1,102,1,102,
        1,102,1,103,1,103,1,103,1,103,1,103,1,104,1,104,1,104,1,104,1,104,
        1,104,1,105,1,105,1,105,1,105,1,105,1,105,1,105,1,106,1,106,1,106,
        1,106,1,106,1,106,1,107,1,107,1,107,1,107,1,107,1,107,1,108,1,108,
        1,108,1,108,1,108,1,108,1,108,1,108,1,108,1,108,1,109,1,109,1,109,
        1,109,1,110,1,110,1,110,1,110,1,110,1,110,1,110,1,111,1,111,1,111,
        1,111,1,111,1,111,1,111,1,111,1,112,1,112,1,112,1,112,1,112,1,113,
        1,113,1,113,1,113,1,113,1,114,1,114,1,114,1,114,1,114,1,114,1,114,
        1,114,1,114,1,115,1,115,1,115,1,115,1,115,1,115,1,115,1,115,1,115,
        1,115,1,116,1,116,1,116,1,116,1,116,1,116,1,117,1,117,1,117,1,117,
        1,117,1,117,1,118,1,118,1,118,1,118,1,118,1,118,1,118,1,118,1,119,
        1,119,1,119,1,119,1,119,1,119,1,119,1,120,1,120,1,120,1,120,1,120,
        1,120,1,120,1,120,1,120,1,121,1,121,1,121,1,121,1,121,1,121,1,122,
        1,122,1,122,1,122,1,122,1,122,1,122,1,122,1,122,1,123,1,123,1,123,
        1,123,1,123,1,123,1,123,1,124,1,124,1,124,1,124,1,124,1,124,1,124,
        1,125,1,125,1,125,1,125,1,125,1,126,1,126,1,126,1,127,1,127,1,127,
        1,127,1,127,1,127,1,127,1,128,1,128,1,128,1,128,1,128,1,128,1,128,
        1,128,1,128,1,128,1,129,1,129,1,129,1,130,1,130,1,130,1,130,1,130,
        1,130,1,130,1,130,1,130,1,130,1,131,1,131,1,131,1,131,1,131,1,131,
        1,131,1,131,1,132,1,132,1,132,1,132,1,132,1,132,1,132,1,133,1,133,
        1,133,1,133,1,133,1,133,1,134,1,134,1,134,1,134,1,134,1,134,1,135,
        1,135,1,135,1,135,1,135,1,135,1,135,1,136,1,136,1,136,1,136,1,136,
        1,136,1,136,1,136,1,136,1,136,1,137,1,137,1,137,1,137,1,137,1,137,
        1,137,1,137,1,137,1,138,1,138,1,138,1,138,1,138,1,139,1,139,1,139,
        1,139,1,139,1,139,1,139,1,139,1,140,1,140,1,140,1,141,1,141,1,141,
        1,142,1,142,1,142,1,142,1,142,1,142,1,142,1,142,1,142,1,142,1,143,
        1,143,1,143,1,143,1,143,1,143,1,143,1,143,1,144,1,144,1,144,1,144,
        1,144,1,145,1,145,1,145,1,145,1,145,1,146,1,146,1,146,1,146,1,146,
        1,146,1,146,1,146,1,146,1,146,1,146,1,147,1,147,1,147,1,147,1,147,
        1,147,1,147,1,147,1,147,1,147,1,147,1,147,1,148,1,148,1,148,1,148,
        1,148,1,148,1,148,1,148,1,148,1,148,1,148,1,148,1,149,1,149,1,149,
        1,149,1,149,1,149,1,149,1,149,1,149,1,149,1,149,1,150,1,150,1,150,
        1,150,1,150,1,150,1,150,1,150,1,150,1,150,1,150,1,151,1,151,1,151,
        1,151,1,151,1,151,1,151,1,151,1,151,1,151,1,151,1,152,1,152,1,152,
        1,152,1,152,1,153,1,153,1,153,1,153,1,154,1,154,1,154,1,154,1,154,
        1,155,1,155,1,155,1,155,1,155,1,155,1,155,1,155,1,155,1,156,1,156,
        1,156,1,156,1,156,1,157,1,157,1,157,1,157,1,157,1,157,1,157,1,157,
        1,158,1,158,1,158,1,158,1,158,1,158,1,158,1,158,1,159,1,159,1,159,
        1,159,1,159,1,159,1,160,1,160,1,160,1,160,1,160,1,161,1,161,1,161,
        1,161,1,161,1,161,1,162,1,162,1,162,1,162,1,162,1,163,1,163,1,163,
        1,163,1,163,1,163,1,164,1,164,1,164,1,164,1,164,1,164,1,164,1,164,
        1,165,1,165,1,165,1,165,1,165,1,165,1,166,1,166,1,166,1,166,1,166,
        1,166,1,166,1,166,1,166,1,166,1,167,1,167,1,167,1,167,1,167,1,167,
        1,167,1,167,1,167,1,167,1,167,1,167,1,167,1,167,1,167,1,168,1,168,
        1,168,1,168,1,168,1,168,1,168,1,168,1,169,1,169,1,169,1,169,1,169,
        1,170,1,170,1,170,1,170,1,171,1,171,1,171,1,171,1,171,1,171,1,172,
        1,172,1,172,1,172,1,172,1,172,1,172,1,172,1,173,1,173,1,173,1,173,
        1,173,1,173,1,173,1,173,1,174,1,174,1,174,1,174,1,174,1,174,1,174,
        1,174,1,174,1,174,1,174,1,174,1,174,1,174,1,174,1,174,1,175,1,175,
        1,175,1,175,1,175,1,175,1,175,1,175,1,175,1,175,1,175,1,175,1,175,
        1,176,1,176,1,176,1,176,1,176,1,176,1,176,1,176,1,176,1,177,1,177,
        1,177,1,177,1,177,1,177,1,178,1,178,1,178,1,178,1,178,1,178,1,178,
        1,179,1,179,1,179,1,179,1,179,1,179,1,180,1,180,1,180,1,180,1,180,
        1,180,1,180,1,180,1,181,1,181,1,181,1,181,1,181,1,181,1,181,1,182,
        1,182,1,182,1,182,1,182,1,183,1,183,1,183,1,183,1,184,1,184,1,184,
        1,184,1,185,1,185,1,185,1,185,1,185,1,186,1,186,1,186,1,186,1,186,
        1,187,1,187,1,187,1,188,1,188,1,188,1,188,1,188,1,189,1,189,1,189,
        1,189,1,189,1,189,1,189,1,189,1,189,1,189,1,190,1,190,1,190,1,190,
        1,191,1,191,1,191,1,191,1,191,1,192,1,192,1,192,1,192,1,192,1,192,
        1,192,1,193,1,193,1,193,1,193,1,193,1,193,1,194,1,194,1,194,1,194,
        1,194,1,194,1,194,1,195,1,195,1,195,1,196,1,196,1,196,1,196,1,196,
        1,196,1,196,1,197,1,197,1,197,1,197,1,197,1,198,1,198,1,198,1,199,
        1,199,1,199,1,199,1,200,1,200,1,200,1,200,1,200,1,201,1,201,1,201,
        1,201,1,201,1,201,1,201,1,202,1,202,1,202,1,203,1,203,1,203,1,203,
        1,203,1,203,1,204,1,204,1,204,1,204,1,204,1,204,1,204,1,204,1,204,
        1,204,1,204,1,205,1,205,1,205,1,205,1,205,1,205,1,206,1,206,1,206,
        1,206,1,206,1,206,1,206,1,207,1,207,1,207,1,207,1,207,1,208,1,208,
        1,208,1,208,1,208,1,208,1,208,1,208,1,208,1,209,1,209,1,209,1,209,
        1,209,1,209,1,209,1,209,1,209,1,209,1,210,1,210,1,210,1,210,1,210,
        1,210,1,210,1,210,1,210,1,210,1,210,1,211,1,211,1,211,1,211,1,211,
        1,211,1,211,1,211,1,212,1,212,1,212,1,212,1,212,1,213,1,213,1,213,
        1,213,1,213,1,214,1,214,1,214,1,214,1,214,1,214,1,214,1,214,1,215,
        1,215,1,215,1,215,1,216,1,216,1,216,1,216,1,216,1,216,1,216,1,217,
        1,217,1,217,1,217,1,217,1,217,1,217,1,217,1,218,1,218,1,218,1,218,
        1,218,1,219,1,219,1,219,1,219,1,219,1,219,1,219,1,219,1,219,1,220,
        1,220,1,220,1,220,1,220,1,220,1,220,1,220,1,220,1,220,1,221,1,221,
        1,221,1,221,1,221,1,221,1,221,1,221,1,221,1,221,1,222,1,222,1,222,
        1,222,1,222,1,222,1,222,1,222,1,223,1,223,1,223,1,223,1,223,1,223,
        1,223,1,223,1,223,1,223,1,223,1,224,1,224,1,224,1,224,1,224,1,224,
        1,224,1,224,1,224,1,224,1,224,1,225,1,225,1,225,1,225,1,225,1,225,
        1,226,1,226,1,226,1,226,1,226,1,226,1,226,1,227,1,227,1,227,1,227,
        1,227,1,227,1,228,1,228,1,228,1,228,1,228,1,229,1,229,1,229,1,229,
        1,229,1,229,1,229,1,229,1,229,1,229,1,230,1,230,1,230,1,230,1,230,
        1,230,1,230,1,230,1,231,1,231,1,231,1,231,1,231,1,231,1,231,1,232,
        1,232,1,232,1,232,1,232,1,232,1,232,1,233,1,233,1,233,1,233,1,233,
        1,233,1,233,1,233,1,233,1,233,1,233,1,234,1,234,1,234,1,234,1,234,
        1,234,1,234,1,234,1,235,1,235,1,235,1,235,1,235,1,235,1,236,1,236,
        1,236,1,236,1,236,1,236,1,236,1,236,1,237,1,237,1,237,1,237,1,237,
        1,237,1,237,1,237,1,237,1,238,1,238,1,238,1,238,1,238,1,238,1,238,
        1,239,1,239,1,239,1,239,1,239,1,239,1,239,1,239,1,239,1,239,1,240,
        1,240,1,240,1,240,1,240,1,240,1,240,1,240,1,241,1,241,1,241,1,241,
        1,241,1,241,1,241,1,242,1,242,1,242,1,242,1,242,1,242,1,243,1,243,
        1,243,1,243,1,243,1,244,1,244,1,244,1,244,1,244,1,244,1,245,1,245,
        1,245,1,245,1,245,1,245,1,245,1,245,1,245,1,246,1,246,1,246,1,246,
        1,246,1,246,1,246,1,247,1,247,1,247,1,247,1,248,1,248,1,248,1,248,
        1,248,1,249,1,249,1,249,1,249,1,249,1,249,1,249,1,249,1,250,1,250,
        1,250,1,250,1,250,1,250,1,250,1,251,1,251,1,251,1,251,1,251,1,251,
        1,251,1,252,1,252,1,252,1,252,1,252,1,252,1,252,1,252,1,253,1,253,
        1,253,1,253,1,253,1,253,1,253,1,254,1,254,1,254,1,254,1,254,1,254,
        1,254,1,254,1,254,1,255,1,255,1,255,1,255,1,255,1,256,1,256,1,256,
        1,256,1,256,1,256,1,256,1,257,1,257,1,257,1,257,1,257,1,257,1,257,
        1,257,1,257,1,257,1,257,1,257,1,257,1,258,1,258,1,258,1,258,1,258,
        1,258,1,258,1,258,1,259,1,259,1,259,1,259,1,260,1,260,1,260,1,260,
        1,260,1,261,1,261,1,261,1,261,1,261,1,262,1,262,1,262,1,262,1,262,
        1,263,1,263,1,263,1,263,1,263,1,263,1,264,1,264,1,264,1,264,1,264,
        1,264,1,265,1,265,1,265,1,265,1,265,1,265,1,266,1,266,1,266,1,266,
        1,266,1,266,1,266,1,267,1,267,1,267,1,267,1,267,1,267,1,267,1,267,
        1,267,1,267,1,268,1,268,1,268,1,268,1,268,1,268,1,268,1,269,1,269,
        1,269,1,269,1,269,1,269,1,270,1,270,1,270,1,270,1,270,1,270,1,270,
        1,271,1,271,1,271,1,271,1,271,1,271,1,271,1,271,1,271,1,271,1,271,
        1,271,1,272,1,272,1,272,1,272,1,272,1,273,1,273,1,273,1,273,1,273,
        1,273,1,273,1,274,1,274,1,274,1,274,1,274,1,275,1,275,1,275,1,275,
        1,275,1,276,1,276,1,276,1,276,1,276,1,277,1,277,1,277,1,277,1,277,
        1,277,1,277,1,277,1,277,1,277,1,278,1,278,1,278,1,279,1,279,1,279,
        1,279,1,279,1,279,1,279,1,279,1,279,1,280,1,280,1,280,1,280,1,280,
        1,280,1,280,1,280,1,280,1,280,1,280,1,280,1,281,1,281,1,281,1,281,
        1,281,1,282,1,282,1,282,1,282,1,282,1,283,1,283,1,283,1,283,1,283,
        1,283,1,283,1,283,1,283,1,284,1,284,1,284,1,284,1,284,1,284,1,284,
        1,284,1,284,1,285,1,285,1,285,1,285,1,285,1,286,1,286,1,286,1,286,
        1,286,1,286,1,286,1,286,1,287,1,287,1,287,1,287,1,287,1,287,1,287,
        1,287,1,287,1,287,1,288,1,288,1,288,1,288,1,288,1,288,1,288,1,288,
        1,288,1,288,1,288,1,288,1,289,1,289,1,289,1,289,1,289,1,289,1,289,
        1,289,1,289,1,289,1,289,1,289,1,289,1,289,1,290,1,290,1,290,1,290,
        1,290,1,290,1,291,1,291,1,291,1,291,1,291,1,291,1,291,1,292,1,292,
        1,292,1,292,1,292,1,292,1,292,1,292,1,293,1,293,1,293,1,293,1,293,
        1,293,1,293,1,293,1,293,1,293,1,294,1,294,1,294,1,294,1,294,1,294,
        1,294,1,295,1,295,1,295,1,295,1,295,1,295,1,296,1,296,1,296,1,296,
        1,296,1,296,1,296,1,297,1,297,1,297,1,297,1,298,1,298,1,298,1,298,
        1,298,1,299,1,299,1,299,1,299,1,299,1,299,1,300,1,300,1,300,1,300,
        1,300,1,300,1,301,1,301,1,301,1,301,1,301,1,301,1,302,1,302,1,302,
        1,302,1,302,1,303,1,303,1,303,1,303,1,303,1,303,1,303,1,303,1,303,
        1,304,1,304,1,304,1,304,1,304,1,304,1,305,1,305,1,305,1,305,1,305,
        1,305,1,305,1,306,1,306,1,306,1,306,1,306,1,306,1,306,1,306,1,307,
        1,307,1,307,1,307,1,307,1,307,1,307,1,307,1,308,1,308,1,308,1,308,
        1,308,1,309,1,309,1,309,1,309,1,309,1,310,1,310,1,310,1,310,1,310,
        1,310,1,311,1,311,1,311,1,311,1,311,1,311,1,312,1,312,1,312,1,312,
        1,312,1,312,1,312,1,313,1,313,1,313,1,313,1,313,1,314,1,314,1,314,
        1,314,1,314,1,314,1,314,1,315,1,315,1,315,1,315,1,315,1,315,1,315,
        1,315,1,316,1,316,1,316,1,316,1,316,1,317,1,317,1,317,1,317,1,317,
        1,317,1,317,1,317,1,318,1,318,1,318,1,318,1,318,1,318,1,319,1,319,
        1,319,1,319,1,319,1,320,1,320,1,320,1,320,1,320,1,321,1,321,1,322,
        1,322,1,322,1,322,3,322,2961,8,322,1,323,1,323,1,324,1,324,1,324,
        1,325,1,325,1,326,1,326,1,326,1,327,1,327,1,328,1,328,1,329,1,329,
        1,330,1,330,1,331,1,331,1,332,1,332,1,332,1,333,1,333,1,334,1,334,
        1,335,1,335,1,335,1,335,5,335,2994,8,335,10,335,12,335,2997,9,335,
        1,335,1,335,1,336,1,336,1,336,1,336,1,336,1,336,1,336,5,336,3008,
        8,336,10,336,12,336,3011,9,336,1,336,1,336,1,337,1,337,1,337,1,337,
        5,337,3019,8,337,10,337,12,337,3022,9,337,1,337,1,337,1,337,1,338,
        1,338,1,338,1,338,5,338,3031,8,338,10,338,12,338,3034,9,338,1,338,
        1,338,1,339,1,339,1,339,1,339,3,339,3042,8,339,1,340,1,340,1,340,
        3,340,3047,8,340,1,340,1,340,3,340,3051,8,340,1,341,4,341,3054,8,
        341,11,341,12,341,3055,1,341,1,341,5,341,3060,8,341,10,341,12,341,
        3063,9,341,3,341,3065,8,341,1,341,1,341,1,341,1,341,4,341,3071,8,
        341,11,341,12,341,3072,1,341,1,341,3,341,3077,8,341,1,342,1,342,
        3,342,3081,8,342,1,342,1,342,1,342,5,342,3086,8,342,10,342,12,342,
        3089,9,342,1,343,1,343,1,343,1,343,4,343,3095,8,343,11,343,12,343,
        3096,1,344,1,344,1,344,1,344,5,344,3103,8,344,10,344,12,344,3106,
        9,344,1,344,1,344,1,345,1,345,1,345,1,345,5,345,3114,8,345,10,345,
        12,345,3117,9,345,1,345,1,345,1,346,1,346,3,346,3123,8,346,1,346,
        5,346,3126,8,346,10,346,12,346,3129,9,346,1,347,1,347,1,347,1,347,
        3,347,3135,8,347,1,347,1,347,3,347,3139,8,347,4,347,3141,8,347,11,
        347,12,347,3142,1,348,1,348,1,348,1,348,3,348,3149,8,348,1,348,4,
        348,3152,8,348,11,348,12,348,3153,1,349,1,349,1,349,1,349,3,349,
        3160,8,349,1,349,4,349,3163,8,349,11,349,12,349,3164,1,350,1,350,
        3,350,3169,8,350,1,350,4,350,3172,8,350,11,350,12,350,3173,1,351,
        1,351,1,352,1,352,1,353,1,353,1,353,1,353,5,353,3184,8,353,10,353,
        12,353,3187,9,353,1,353,3,353,3190,8,353,1,353,3,353,3193,8,353,
        1,353,1,353,1,354,1,354,1,354,1,354,5,354,3201,8,354,10,354,12,354,
        3204,9,354,1,354,1,354,1,354,1,354,1,354,1,355,4,355,3212,8,355,
        11,355,12,355,3213,1,355,1,355,1,356,1,356,2,3020,3202,0,357,1,1,
        3,2,5,3,7,4,9,5,11,6,13,7,15,8,17,9,19,10,21,11,23,12,25,13,27,14,
        29,15,31,16,33,17,35,18,37,19,39,20,41,21,43,22,45,23,47,24,49,25,
        51,26,53,27,55,28,57,29,59,30,61,31,63,32,65,33,67,34,69,35,71,36,
        73,37,75,38,77,39,79,40,81,41,83,42,85,43,87,44,89,45,91,46,93,47,
        95,48,97,49,99,50,101,51,103,52,105,53,107,54,109,55,111,56,113,
        57,115,58,117,59,119,60,121,61,123,62,125,63,127,64,129,65,131,66,
        133,67,135,68,137,69,139,70,141,71,143,72,145,73,147,74,149,75,151,
        76,153,77,155,78,157,79,159,80,161,81,163,82,165,83,167,84,169,85,
        171,86,173,87,175,88,177,89,179,90,181,91,183,92,185,93,187,94,189,
        95,191,96,193,97,195,98,197,99,199,100,201,101,203,102,205,103,207,
        104,209,105,211,106,213,107,215,108,217,109,219,110,221,111,223,
        112,225,113,227,114,229,115,231,116,233,117,235,118,237,119,239,
        120,241,121,243,122,245,123,247,124,249,125,251,126,253,127,255,
        128,257,129,259,130,261,131,263,132,265,133,267,134,269,135,271,
        136,273,137,275,138,277,139,279,140,281,141,283,142,285,143,287,
        144,289,145,291,146,293,147,295,148,297,149,299,150,301,151,303,
        152,305,153,307,154,309,155,311,156,313,157,315,158,317,159,319,
        160,321,161,323,162,325,163,327,164,329,165,331,166,333,167,335,
        168,337,169,339,170,341,171,343,172,345,173,347,174,349,175,351,
        176,353,177,355,178,357,179,359,180,361,181,363,182,365,183,367,
        184,369,185,371,186,373,187,375,188,377,189,379,190,381,191,383,
        192,385,193,387,194,389,195,391,196,393,197,395,198,397,199,399,
        200,401,201,403,202,405,203,407,204,409,205,411,206,413,207,415,
        208,417,209,419,210,421,211,423,212,425,213,427,214,429,215,431,
        216,433,217,435,218,437,219,439,220,441,221,443,222,445,223,447,
        224,449,225,451,226,453,227,455,228,457,229,459,230,461,231,463,
        232,465,233,467,234,469,235,471,236,473,237,475,238,477,239,479,
        240,481,241,483,242,485,243,487,244,489,245,491,246,493,247,495,
        248,497,249,499,250,501,251,503,252,505,253,507,254,509,255,511,
        256,513,257,515,258,517,259,519,260,521,261,523,262,525,263,527,
        264,529,265,531,266,533,267,535,268,537,269,539,270,541,271,543,
        272,545,273,547,274,549,275,551,276,553,277,555,278,557,279,559,
        280,561,281,563,282,565,283,567,284,569,285,571,286,573,287,575,
        288,577,289,579,290,581,291,583,292,585,293,587,294,589,295,591,
        296,593,297,595,298,597,299,599,300,601,301,603,302,605,303,607,
        304,609,305,611,306,613,307,615,308,617,309,619,310,621,311,623,
        312,625,313,627,314,629,315,631,316,633,317,635,318,637,319,639,
        320,641,321,643,322,645,323,647,324,649,325,651,326,653,327,655,
        328,657,329,659,330,661,331,663,332,665,333,667,334,669,335,671,
        336,673,337,675,338,677,339,679,340,681,341,683,342,685,343,687,
        344,689,345,691,346,693,0,695,0,697,0,699,0,701,0,703,0,705,0,707,
        347,709,348,711,349,713,350,1,0,37,2,0,83,83,115,115,2,0,75,75,107,
        107,2,0,73,73,105,105,2,0,80,80,112,112,2,0,65,65,97,97,2,0,66,66,
        98,98,2,0,69,69,101,101,2,0,78,78,110,110,2,0,84,84,116,116,2,0,
        68,68,100,100,2,0,77,77,109,109,2,0,70,70,102,102,2,0,82,82,114,
        114,2,0,76,76,108,108,2,0,89,89,121,121,2,0,90,90,122,122,2,0,67,
        67,99,99,2,0,85,85,117,117,2,0,72,72,104,104,2,0,79,79,111,111,2,
        0,71,71,103,103,2,0,87,87,119,119,2,0,88,88,120,120,2,0,86,86,118,
        118,2,0,74,74,106,106,2,0,81,81,113,113,1,0,39,39,1,0,34,34,1,0,
        96,96,2,0,65,70,97,102,1,0,48,55,1,0,48,49,2,0,43,43,45,45,1,0,48,
        57,2,0,65,90,97,122,2,0,10,10,13,13,3,0,9,10,13,13,32,32,3255,0,
        1,1,0,0,0,0,3,1,0,0,0,0,5,1,0,0,0,0,7,1,0,0,0,0,9,1,0,0,0,0,11,1,
        0,0,0,0,13,1,0,0,0,0,15,1,0,0,0,0,17,1,0,0,0,0,19,1,0,0,0,0,21,1,
        0,0,0,0,23,1,0,0,0,0,25,1,0,0,0,0,27,1,0,0,0,0,29,1,0,0,0,0,31,1,
        0,0,0,0,33,1,0,0,0,0,35,1,0,0,0,0,37,1,0,0,0,0,39,1,0,0,0,0,41,1,
        0,0,0,0,43,1,0,0,0,0,45,1,0,0,0,0,47,1,0,0,0,0,49,1,0,0,0,0,51,1,
        0,0,0,0,53,1,0,0,0,0,55,1,0,0,0,0,57,1,0,0,0,0,59,1,0,0,0,0,61,1,
        0,0,0,0,63,1,0,0,0,0,65,1,0,0,0,0,67,1,0,0,0,0,69,1,0,0,0,0,71,1,
        0,0,0,0,73,1,0,0,0,0,75,1,0,0,0,0,77,1,0,0,0,0,79,1,0,0,0,0,81,1,
        0,0,0,0,83,1,0,0,0,0,85,1,0,0,0,0,87,1,0,0,0,0,89,1,0,0,0,0,91,1,
        0,0,0,0,93,1,0,0,0,0,95,1,0,0,0,0,97,1,0,0,0,0,99,1,0,0,0,0,101,
        1,0,0,0,0,103,1,0,0,0,0,105,1,0,0,0,0,107,1,0,0,0,0,109,1,0,0,0,
        0,111,1,0,0,0,0,113,1,0,0,0,0,115,1,0,0,0,0,117,1,0,0,0,0,119,1,
        0,0,0,0,121,1,0,0,0,0,123,1,0,0,0,0,125,1,0,0,0,0,127,1,0,0,0,0,
        129,1,0,0,0,0,131,1,0,0,0,0,133,1,0,0,0,0,135,1,0,0,0,0,137,1,0,
        0,0,0,139,1,0,0,0,0,141,1,0,0,0,0,143,1,0,0,0,0,145,1,0,0,0,0,147,
        1,0,0,0,0,149,1,0,0,0,0,151,1,0,0,0,0,153,1,0,0,0,0,155,1,0,0,0,
        0,157,1,0,0,0,0,159,1,0,0,0,0,161,1,0,0,0,0,163,1,0,0,0,0,165,1,
        0,0,0,0,167,1,0,0,0,0,169,1,0,0,0,0,171,1,0,0,0,0,173,1,0,0,0,0,
        175,1,0,0,0,0,177,1,0,0,0,0,179,1,0,0,0,0,181,1,0,0,0,0,183,1,0,
        0,0,0,185,1,0,0,0,0,187,1,0,0,0,0,189,1,0,0,0,0,191,1,0,0,0,0,193,
        1,0,0,0,0,195,1,0,0,0,0,197,1,0,0,0,0,199,1,0,0,0,0,201,1,0,0,0,
        0,203,1,0,0,0,0,205,1,0,0,0,0,207,1,0,0,0,0,209,1,0,0,0,0,211,1,
        0,0,0,0,213,1,0,0,0,0,215,1,0,0,0,0,217,1,0,0,0,0,219,1,0,0,0,0,
        221,1,0,0,0,0,223,1,0,0,0,0,225,1,0,0,0,0,227,1,0,0,0,0,229,1,0,
        0,0,0,231,1,0,0,0,0,233,1,0,0,0,0,235,1,0,0,0,0,237,1,0,0,0,0,239,
        1,0,0,0,0,241,1,0,0,0,0,243,1,0,0,0,0,245,1,0,0,0,0,247,1,0,0,0,
        0,249,1,0,0,0,0,251,1,0,0,0,0,253,1,0,0,0,0,255,1,0,0,0,0,257,1,
        0,0,0,0,259,1,0,0,0,0,261,1,0,0,0,0,263,1,0,0,0,0,265,1,0,0,0,0,
        267,1,0,0,0,0,269,1,0,0,0,0,271,1,0,0,0,0,273,1,0,0,0,0,275,1,0,
        0,0,0,277,1,0,0,0,0,279,1,0,0,0,0,281,1,0,0,0,0,283,1,0,0,0,0,285,
        1,0,0,0,0,287,1,0,0,0,0,289,1,0,0,0,0,291,1,0,0,0,0,293,1,0,0,0,
        0,295,1,0,0,0,0,297,1,0,0,0,0,299,1,0,0,0,0,301,1,0,0,0,0,303,1,
        0,0,0,0,305,1,0,0,0,0,307,1,0,0,0,0,309,1,0,0,0,0,311,1,0,0,0,0,
        313,1,0,0,0,0,315,1,0,0,0,0,317,1,0,0,0,0,319,1,0,0,0,0,321,1,0,
        0,0,0,323,1,0,0,0,0,325,1,0,0,0,0,327,1,0,0,0,0,329,1,0,0,0,0,331,
        1,0,0,0,0,333,1,0,0,0,0,335,1,0,0,0,0,337,1,0,0,0,0,339,1,0,0,0,
        0,341,1,0,0,0,0,343,1,0,0,0,0,345,1,0,0,0,0,347,1,0,0,0,0,349,1,
        0,0,0,0,351,1,0,0,0,0,353,1,0,0,0,0,355,1,0,0,0,0,357,1,0,0,0,0,
        359,1,0,0,0,0,361,1,0,0,0,0,363,1,0,0,0,0,365,1,0,0,0,0,367,1,0,
        0,0,0,369,1,0,0,0,0,371,1,0,0,0,0,373,1,0,0,0,0,375,1,0,0,0,0,377,
        1,0,0,0,0,379,1,0,0,0,0,381,1,0,0,0,0,383,1,0,0,0,0,385,1,0,0,0,
        0,387,1,0,0,0,0,389,1,0,0,0,0,391,1,0,0,0,0,393,1,0,0,0,0,395,1,
        0,0,0,0,397,1,0,0,0,0,399,1,0,0,0,0,401,1,0,0,0,0,403,1,0,0,0,0,
        405,1,0,0,0,0,407,1,0,0,0,0,409,1,0,0,0,0,411,1,0,0,0,0,413,1,0,
        0,0,0,415,1,0,0,0,0,417,1,0,0,0,0,419,1,0,0,0,0,421,1,0,0,0,0,423,
        1,0,0,0,0,425,1,0,0,0,0,427,1,0,0,0,0,429,1,0,0,0,0,431,1,0,0,0,
        0,433,1,0,0,0,0,435,1,0,0,0,0,437,1,0,0,0,0,439,1,0,0,0,0,441,1,
        0,0,0,0,443,1,0,0,0,0,445,1,0,0,0,0,447,1,0,0,0,0,449,1,0,0,0,0,
        451,1,0,0,0,0,453,1,0,0,0,0,455,1,0,0,0,0,457,1,0,0,0,0,459,1,0,
        0,0,0,461,1,0,0,0,0,463,1,0,0,0,0,465,1,0,0,0,0,467,1,0,0,0,0,469,
        1,0,0,0,0,471,1,0,0,0,0,473,1,0,0,0,0,475,1,0,0,0,0,477,1,0,0,0,
        0,479,1,0,0,0,0,481,1,0,0,0,0,483,1,0,0,0,0,485,1,0,0,0,0,487,1,
        0,0,0,0,489,1,0,0,0,0,491,1,0,0,0,0,493,1,0,0,0,0,495,1,0,0,0,0,
        497,1,0,0,0,0,499,1,0,0,0,0,501,1,0,0,0,0,503,1,0,0,0,0,505,1,0,
        0,0,0,507,1,0,0,0,0,509,1,0,0,0,0,511,1,0,0,0,0,513,1,0,0,0,0,515,
        1,0,0,0,0,517,1,0,0,0,0,519,1,0,0,0,0,521,1,0,0,0,0,523,1,0,0,0,
        0,525,1,0,0,0,0,527,1,0,0,0,0,529,1,0,0,0,0,531,1,0,0,0,0,533,1,
        0,0,0,0,535,1,0,0,0,0,537,1,0,0,0,0,539,1,0,0,0,0,541,1,0,0,0,0,
        543,1,0,0,0,0,545,1,0,0,0,0,547,1,0,0,0,0,549,1,0,0,0,0,551,1,0,
        0,0,0,553,1,0,0,0,0,555,1,0,0,0,0,557,1,0,0,0,0,559,1,0,0,0,0,561,
        1,0,0,0,0,563,1,0,0,0,0,565,1,0,0,0,0,567,1,0,0,0,0,569,1,0,0,0,
        0,571,1,0,0,0,0,573,1,0,0,0,0,575,1,0,0,0,0,577,1,0,0,0,0,579,1,
        0,0,0,0,581,1,0,0,0,0,583,1,0,0,0,0,585,1,0,0,0,0,587,1,0,0,0,0,
        589,1,0,0,0,0,591,1,0,0,0,0,593,1,0,0,0,0,595,1,0,0,0,0,597,1,0,
        0,0,0,599,1,0,0,0,0,601,1,0,0,0,0,603,1,0,0,0,0,605,1,0,0,0,0,607,
        1,0,0,0,0,609,1,0,0,0,0,611,1,0,0,0,0,613,1,0,0,0,0,615,1,0,0,0,
        0,617,1,0,0,0,0,619,1,0,0,0,0,621,1,0,0,0,0,623,1,0,0,0,0,625,1,
        0,0,0,0,627,1,0,0,0,0,629,1,0,0,0,0,631,1,0,0,0,0,633,1,0,0,0,0,
        635,1,0,0,0,0,637,1,0,0,0,0,639,1,0,0,0,0,641,1,0,0,0,0,643,1,0,
        0,0,0,645,1,0,0,0,0,647,1,0,0,0,0,649,1,0,0,0,0,651,1,0,0,0,0,653,
        1,0,0,0,0,655,1,0,0,0,0,657,1,0,0,0,0,659,1,0,0,0,0,661,1,0,0,0,
        0,663,1,0,0,0,0,665,1,0,0,0,0,667,1,0,0,0,0,669,1,0,0,0,0,671,1,
        0,0,0,0,673,1,0,0,0,0,675,1,0,0,0,0,677,1,0,0,0,0,679,1,0,0,0,0,
        681,1,0,0,0,0,683,1,0,0,0,0,685,1,0,0,0,0,687,1,0,0,0,0,689,1,0,
        0,0,0,691,1,0,0,0,0,707,1,0,0,0,0,709,1,0,0,0,0,711,1,0,0,0,0,713,
        1,0,0,0,1,715,1,0,0,0,3,717,1,0,0,0,5,719,1,0,0,0,7,721,1,0,0,0,
        9,723,1,0,0,0,11,725,1,0,0,0,13,730,1,0,0,0,15,733,1,0,0,0,17,736,
        1,0,0,0,19,738,1,0,0,0,21,740,1,0,0,0,23,742,1,0,0,0,25,744,1,0,
        0,0,27,746,1,0,0,0,29,748,1,0,0,0,31,751,1,0,0,0,33,754,1,0,0,0,
        35,756,1,0,0,0,37,758,1,0,0,0,39,765,1,0,0,0,41,769,1,0,0,0,43,775,
        1,0,0,0,45,781,1,0,0,0,47,785,1,0,0,0,49,791,1,0,0,0,51,799,1,0,
        0,0,53,803,1,0,0,0,55,807,1,0,0,0,57,813,1,0,0,0,59,816,1,0,0,0,
        61,820,1,0,0,0,63,823,1,0,0,0,65,837,1,0,0,0,67,842,1,0,0,0,69,848,
        1,0,0,0,71,858,1,0,0,0,73,866,1,0,0,0,75,871,1,0,0,0,77,878,1,0,
        0,0,79,887,1,0,0,0,81,890,1,0,0,0,83,895,1,0,0,0,85,902,1,0,0,0,
        87,910,1,0,0,0,89,915,1,0,0,0,91,920,1,0,0,0,93,928,1,0,0,0,95,937,
        1,0,0,0,97,944,1,0,0,0,99,952,1,0,0,0,101,960,1,0,0,0,103,967,1,
        0,0,0,105,977,1,0,0,0,107,989,1,0,0,0,109,1000,1,0,0,0,111,1006,
        1,0,0,0,113,1018,1,0,0,0,115,1032,1,0,0,0,117,1039,1,0,0,0,119,1045,
        1,0,0,0,121,1050,1,0,0,0,123,1058,1,0,0,0,125,1074,1,0,0,0,127,1087,
        1,0,0,0,129,1100,1,0,0,0,131,1113,1,0,0,0,133,1128,1,0,0,0,135,1141,
        1,0,0,0,137,1159,1,0,0,0,139,1172,1,0,0,0,141,1177,1,0,0,0,143,1182,
        1,0,0,0,145,1186,1,0,0,0,147,1197,1,0,0,0,149,1205,1,0,0,0,151,1213,
        1,0,0,0,153,1220,1,0,0,0,155,1228,1,0,0,0,157,1235,1,0,0,0,159,1240,
        1,0,0,0,161,1245,1,0,0,0,163,1254,1,0,0,0,165,1265,1,0,0,0,167,1279,
        1,0,0,0,169,1288,1,0,0,0,171,1300,1,0,0,0,173,1303,1,0,0,0,175,1310,
        1,0,0,0,177,1315,1,0,0,0,179,1320,1,0,0,0,181,1326,1,0,0,0,183,1333,
        1,0,0,0,185,1342,1,0,0,0,187,1346,1,0,0,0,189,1352,1,0,0,0,191,1359,
        1,0,0,0,193,1366,1,0,0,0,195,1376,1,0,0,0,197,1384,1,0,0,0,199,1391,
        1,0,0,0,201,1399,1,0,0,0,203,1407,1,0,0,0,205,1412,1,0,0,0,207,1418,
        1,0,0,0,209,1423,1,0,0,0,211,1429,1,0,0,0,213,1436,1,0,0,0,215,1442,
        1,0,0,0,217,1448,1,0,0,0,219,1458,1,0,0,0,221,1462,1,0,0,0,223,1469,
        1,0,0,0,225,1477,1,0,0,0,227,1482,1,0,0,0,229,1487,1,0,0,0,231,1496,
        1,0,0,0,233,1506,1,0,0,0,235,1512,1,0,0,0,237,1518,1,0,0,0,239,1526,
        1,0,0,0,241,1533,1,0,0,0,243,1542,1,0,0,0,245,1548,1,0,0,0,247,1557,
        1,0,0,0,249,1564,1,0,0,0,251,1571,1,0,0,0,253,1576,1,0,0,0,255,1579,
        1,0,0,0,257,1586,1,0,0,0,259,1596,1,0,0,0,261,1599,1,0,0,0,263,1609,
        1,0,0,0,265,1617,1,0,0,0,267,1624,1,0,0,0,269,1630,1,0,0,0,271,1636,
        1,0,0,0,273,1643,1,0,0,0,275,1653,1,0,0,0,277,1662,1,0,0,0,279,1667,
        1,0,0,0,281,1675,1,0,0,0,283,1678,1,0,0,0,285,1681,1,0,0,0,287,1691,
        1,0,0,0,289,1699,1,0,0,0,291,1704,1,0,0,0,293,1709,1,0,0,0,295,1720,
        1,0,0,0,297,1732,1,0,0,0,299,1744,1,0,0,0,301,1755,1,0,0,0,303,1766,
        1,0,0,0,305,1777,1,0,0,0,307,1782,1,0,0,0,309,1786,1,0,0,0,311,1791,
        1,0,0,0,313,1800,1,0,0,0,315,1805,1,0,0,0,317,1813,1,0,0,0,319,1821,
        1,0,0,0,321,1827,1,0,0,0,323,1832,1,0,0,0,325,1838,1,0,0,0,327,1843,
        1,0,0,0,329,1849,1,0,0,0,331,1857,1,0,0,0,333,1863,1,0,0,0,335,1873,
        1,0,0,0,337,1888,1,0,0,0,339,1896,1,0,0,0,341,1901,1,0,0,0,343,1905,
        1,0,0,0,345,1911,1,0,0,0,347,1919,1,0,0,0,349,1927,1,0,0,0,351,1943,
        1,0,0,0,353,1956,1,0,0,0,355,1965,1,0,0,0,357,1971,1,0,0,0,359,1978,
        1,0,0,0,361,1984,1,0,0,0,363,1992,1,0,0,0,365,1999,1,0,0,0,367,2004,
        1,0,0,0,369,2008,1,0,0,0,371,2012,1,0,0,0,373,2017,1,0,0,0,375,2022,
        1,0,0,0,377,2025,1,0,0,0,379,2030,1,0,0,0,381,2040,1,0,0,0,383,2044,
        1,0,0,0,385,2049,1,0,0,0,387,2056,1,0,0,0,389,2062,1,0,0,0,391,2069,
        1,0,0,0,393,2072,1,0,0,0,395,2079,1,0,0,0,397,2084,1,0,0,0,399,2087,
        1,0,0,0,401,2091,1,0,0,0,403,2096,1,0,0,0,405,2103,1,0,0,0,407,2106,
        1,0,0,0,409,2112,1,0,0,0,411,2123,1,0,0,0,413,2129,1,0,0,0,415,2136,
        1,0,0,0,417,2141,1,0,0,0,419,2150,1,0,0,0,421,2160,1,0,0,0,423,2171,
        1,0,0,0,425,2179,1,0,0,0,427,2184,1,0,0,0,429,2189,1,0,0,0,431,2197,
        1,0,0,0,433,2201,1,0,0,0,435,2208,1,0,0,0,437,2216,1,0,0,0,439,2221,
        1,0,0,0,441,2230,1,0,0,0,443,2240,1,0,0,0,445,2250,1,0,0,0,447,2258,
        1,0,0,0,449,2269,1,0,0,0,451,2280,1,0,0,0,453,2286,1,0,0,0,455,2293,
        1,0,0,0,457,2299,1,0,0,0,459,2304,1,0,0,0,461,2314,1,0,0,0,463,2322,
        1,0,0,0,465,2329,1,0,0,0,467,2336,1,0,0,0,469,2347,1,0,0,0,471,2355,
        1,0,0,0,473,2361,1,0,0,0,475,2369,1,0,0,0,477,2378,1,0,0,0,479,2385,
        1,0,0,0,481,2395,1,0,0,0,483,2403,1,0,0,0,485,2410,1,0,0,0,487,2416,
        1,0,0,0,489,2421,1,0,0,0,491,2427,1,0,0,0,493,2436,1,0,0,0,495,2443,
        1,0,0,0,497,2447,1,0,0,0,499,2452,1,0,0,0,501,2460,1,0,0,0,503,2467,
        1,0,0,0,505,2474,1,0,0,0,507,2482,1,0,0,0,509,2489,1,0,0,0,511,2498,
        1,0,0,0,513,2503,1,0,0,0,515,2510,1,0,0,0,517,2523,1,0,0,0,519,2531,
        1,0,0,0,521,2535,1,0,0,0,523,2540,1,0,0,0,525,2545,1,0,0,0,527,2550,
        1,0,0,0,529,2556,1,0,0,0,531,2562,1,0,0,0,533,2568,1,0,0,0,535,2575,
        1,0,0,0,537,2585,1,0,0,0,539,2592,1,0,0,0,541,2598,1,0,0,0,543,2605,
        1,0,0,0,545,2617,1,0,0,0,547,2622,1,0,0,0,549,2629,1,0,0,0,551,2634,
        1,0,0,0,553,2639,1,0,0,0,555,2644,1,0,0,0,557,2654,1,0,0,0,559,2657,
        1,0,0,0,561,2666,1,0,0,0,563,2678,1,0,0,0,565,2683,1,0,0,0,567,2688,
        1,0,0,0,569,2697,1,0,0,0,571,2706,1,0,0,0,573,2711,1,0,0,0,575,2719,
        1,0,0,0,577,2729,1,0,0,0,579,2741,1,0,0,0,581,2755,1,0,0,0,583,2761,
        1,0,0,0,585,2768,1,0,0,0,587,2776,1,0,0,0,589,2786,1,0,0,0,591,2793,
        1,0,0,0,593,2799,1,0,0,0,595,2806,1,0,0,0,597,2810,1,0,0,0,599,2815,
        1,0,0,0,601,2821,1,0,0,0,603,2827,1,0,0,0,605,2833,1,0,0,0,607,2838,
        1,0,0,0,609,2847,1,0,0,0,611,2853,1,0,0,0,613,2860,1,0,0,0,615,2868,
        1,0,0,0,617,2876,1,0,0,0,619,2881,1,0,0,0,621,2886,1,0,0,0,623,2892,
        1,0,0,0,625,2898,1,0,0,0,627,2905,1,0,0,0,629,2910,1,0,0,0,631,2917,
        1,0,0,0,633,2925,1,0,0,0,635,2930,1,0,0,0,637,2938,1,0,0,0,639,2944,
        1,0,0,0,641,2949,1,0,0,0,643,2954,1,0,0,0,645,2960,1,0,0,0,647,2962,
        1,0,0,0,649,2964,1,0,0,0,651,2967,1,0,0,0,653,2969,1,0,0,0,655,2972,
        1,0,0,0,657,2974,1,0,0,0,659,2976,1,0,0,0,661,2978,1,0,0,0,663,2980,
        1,0,0,0,665,2982,1,0,0,0,667,2985,1,0,0,0,669,2987,1,0,0,0,671,2989,
        1,0,0,0,673,3000,1,0,0,0,675,3014,1,0,0,0,677,3026,1,0,0,0,679,3041,
        1,0,0,0,681,3050,1,0,0,0,683,3076,1,0,0,0,685,3080,1,0,0,0,687,3090,
        1,0,0,0,689,3098,1,0,0,0,691,3109,1,0,0,0,693,3120,1,0,0,0,695,3130,
        1,0,0,0,697,3144,1,0,0,0,699,3155,1,0,0,0,701,3166,1,0,0,0,703,3175,
        1,0,0,0,705,3177,1,0,0,0,707,3179,1,0,0,0,709,3196,1,0,0,0,711,3211,
        1,0,0,0,713,3217,1,0,0,0,715,716,5,46,0,0,716,2,1,0,0,0,717,718,
        5,40,0,0,718,4,1,0,0,0,719,720,5,41,0,0,720,6,1,0,0,0,721,722,5,
        44,0,0,722,8,1,0,0,0,723,724,5,64,0,0,724,10,1,0,0,0,725,726,7,0,
        0,0,726,727,7,1,0,0,727,728,7,2,0,0,728,729,7,3,0,0,729,12,1,0,0,
        0,730,731,5,61,0,0,731,732,5,62,0,0,732,14,1,0,0,0,733,734,5,45,
        0,0,734,735,5,62,0,0,735,16,1,0,0,0,736,737,5,91,0,0,737,18,1,0,
        0,0,738,739,5,93,0,0,739,20,1,0,0,0,740,741,5,58,0,0,741,22,1,0,
        0,0,742,743,5,124,0,0,743,24,1,0,0,0,744,745,5,94,0,0,745,26,1,0,
        0,0,746,747,5,36,0,0,747,28,1,0,0,0,748,749,5,123,0,0,749,750,5,
        45,0,0,750,30,1,0,0,0,751,752,5,45,0,0,752,753,5,125,0,0,753,32,
        1,0,0,0,754,755,5,123,0,0,755,34,1,0,0,0,756,757,5,125,0,0,757,36,
        1,0,0,0,758,759,7,4,0,0,759,760,7,5,0,0,760,761,7,0,0,0,761,762,
        7,6,0,0,762,763,7,7,0,0,763,764,7,8,0,0,764,38,1,0,0,0,765,766,7,
        4,0,0,766,767,7,9,0,0,767,768,7,9,0,0,768,40,1,0,0,0,769,770,7,4,
        0,0,770,771,7,9,0,0,771,772,7,10,0,0,772,773,7,2,0,0,773,774,7,7,
        0,0,774,42,1,0,0,0,775,776,7,4,0,0,776,777,7,11,0,0,777,778,7,8,
        0,0,778,779,7,6,0,0,779,780,7,12,0,0,780,44,1,0,0,0,781,782,7,4,
        0,0,782,783,7,13,0,0,783,784,7,13,0,0,784,46,1,0,0,0,785,786,7,4,
        0,0,786,787,7,13,0,0,787,788,7,8,0,0,788,789,7,6,0,0,789,790,7,12,
        0,0,790,48,1,0,0,0,791,792,7,4,0,0,792,793,7,7,0,0,793,794,7,4,0,
        0,794,795,7,13,0,0,795,796,7,14,0,0,796,797,7,15,0,0,797,798,7,6,
        0,0,798,50,1,0,0,0,799,800,7,4,0,0,800,801,7,7,0,0,801,802,7,9,0,
        0,802,52,1,0,0,0,803,804,7,4,0,0,804,805,7,7,0,0,805,806,7,14,0,
        0,806,54,1,0,0,0,807,808,7,4,0,0,808,809,7,12,0,0,809,810,7,12,0,
        0,810,811,7,4,0,0,811,812,7,14,0,0,812,56,1,0,0,0,813,814,7,4,0,
        0,814,815,7,0,0,0,815,58,1,0,0,0,816,817,7,4,0,0,817,818,7,0,0,0,
        818,819,7,16,0,0,819,60,1,0,0,0,820,821,7,4,0,0,821,822,7,8,0,0,
        822,62,1,0,0,0,823,824,7,4,0,0,824,825,7,17,0,0,825,826,7,8,0,0,
        826,827,7,18,0,0,827,828,7,19,0,0,828,829,7,12,0,0,829,830,7,2,0,
        0,830,831,7,15,0,0,831,832,7,4,0,0,832,833,7,8,0,0,833,834,7,2,0,
        0,834,835,7,19,0,0,835,836,7,7,0,0,836,64,1,0,0,0,837,838,7,4,0,
        0,838,839,7,17,0,0,839,840,7,8,0,0,840,841,7,19,0,0,841,66,1,0,0,
        0,842,843,7,5,0,0,843,844,7,6,0,0,844,845,7,20,0,0,845,846,7,2,0,
        0,846,847,7,7,0,0,847,68,1,0,0,0,848,849,7,5,0,0,849,850,7,6,0,0,
        850,851,7,12,0,0,851,852,7,7,0,0,852,853,7,19,0,0,853,854,7,17,0,
        0,854,855,7,13,0,0,855,856,7,13,0,0,856,857,7,2,0,0,857,70,1,0,0,
        0,858,859,7,5,0,0,859,860,7,6,0,0,860,861,7,8,0,0,861,862,7,21,0,
        0,862,863,7,6,0,0,863,864,7,6,0,0,864,865,7,7,0,0,865,72,1,0,0,0,
        866,867,7,5,0,0,867,868,7,19,0,0,868,869,7,8,0,0,869,870,7,18,0,
        0,870,74,1,0,0,0,871,872,7,5,0,0,872,873,7,12,0,0,873,874,7,4,0,
        0,874,875,7,7,0,0,875,876,7,16,0,0,876,877,7,18,0,0,877,76,1,0,0,
        0,878,879,7,5,0,0,879,880,7,12,0,0,880,881,7,4,0,0,881,882,7,7,0,
        0,882,883,7,16,0,0,883,884,7,18,0,0,884,885,7,6,0,0,885,886,7,0,
        0,0,886,78,1,0,0,0,887,888,7,5,0,0,888,889,7,14,0,0,889,80,1,0,0,
        0,890,891,7,16,0,0,891,892,7,4,0,0,892,893,7,13,0,0,893,894,7,13,
        0,0,894,82,1,0,0,0,895,896,7,16,0,0,896,897,7,4,0,0,897,898,7,13,
        0,0,898,899,7,13,0,0,899,900,7,6,0,0,900,901,7,9,0,0,901,84,1,0,
        0,0,902,903,7,16,0,0,903,904,7,4,0,0,904,905,7,0,0,0,905,906,7,16,
        0,0,906,907,7,4,0,0,907,908,7,9,0,0,908,909,7,6,0,0,909,86,1,0,0,
        0,910,911,7,16,0,0,911,912,7,4,0,0,912,913,7,0,0,0,913,914,7,6,0,
        0,914,88,1,0,0,0,915,916,7,16,0,0,916,917,7,4,0,0,917,918,7,0,0,
        0,918,919,7,8,0,0,919,90,1,0,0,0,920,921,7,16,0,0,921,922,7,4,0,
        0,922,923,7,8,0,0,923,924,7,4,0,0,924,925,7,13,0,0,925,926,7,19,
        0,0,926,927,7,20,0,0,927,92,1,0,0,0,928,929,7,16,0,0,929,930,7,4,
        0,0,930,931,7,8,0,0,931,932,7,4,0,0,932,933,7,13,0,0,933,934,7,19,
        0,0,934,935,7,20,0,0,935,936,7,0,0,0,936,94,1,0,0,0,937,938,7,16,
        0,0,938,939,7,19,0,0,939,940,7,13,0,0,940,941,7,17,0,0,941,942,7,
        10,0,0,942,943,7,7,0,0,943,96,1,0,0,0,944,945,7,16,0,0,945,946,7,
        19,0,0,946,947,7,13,0,0,947,948,7,17,0,0,948,949,7,10,0,0,949,950,
        7,7,0,0,950,951,7,0,0,0,951,98,1,0,0,0,952,953,7,16,0,0,953,954,
        7,19,0,0,954,955,7,10,0,0,955,956,7,10,0,0,956,957,7,6,0,0,957,958,
        7,7,0,0,958,959,7,8,0,0,959,100,1,0,0,0,960,961,7,16,0,0,961,962,
        7,19,0,0,962,963,7,10,0,0,963,964,7,10,0,0,964,965,7,2,0,0,965,966,
        7,8,0,0,966,102,1,0,0,0,967,968,7,16,0,0,968,969,7,19,0,0,969,970,
        7,10,0,0,970,971,7,10,0,0,971,972,7,2,0,0,972,973,7,8,0,0,973,974,
        7,8,0,0,974,975,7,6,0,0,975,976,7,9,0,0,976,104,1,0,0,0,977,978,
        7,16,0,0,978,979,7,19,0,0,979,980,7,7,0,0,980,981,7,9,0,0,981,982,
        7,2,0,0,982,983,7,8,0,0,983,984,7,2,0,0,984,985,7,19,0,0,985,986,
        7,7,0,0,986,987,7,4,0,0,987,988,7,13,0,0,988,106,1,0,0,0,989,990,
        7,16,0,0,990,991,7,19,0,0,991,992,7,7,0,0,992,993,7,0,0,0,993,994,
        7,8,0,0,994,995,7,12,0,0,995,996,7,4,0,0,996,997,7,2,0,0,997,998,
        7,7,0,0,998,999,7,8,0,0,999,108,1,0,0,0,1000,1001,7,16,0,0,1001,
        1002,7,19,0,0,1002,1003,7,17,0,0,1003,1004,7,7,0,0,1004,1005,7,8,
        0,0,1005,110,1,0,0,0,1006,1007,7,16,0,0,1007,1008,7,19,0,0,1008,
        1009,7,3,0,0,1009,1010,7,4,0,0,1010,1011,7,12,0,0,1011,1012,7,8,
        0,0,1012,1013,7,2,0,0,1013,1014,7,8,0,0,1014,1015,7,2,0,0,1015,1016,
        7,19,0,0,1016,1017,7,7,0,0,1017,112,1,0,0,0,1018,1019,7,16,0,0,1019,
        1020,7,19,0,0,1020,1021,7,12,0,0,1021,1022,7,12,0,0,1022,1023,7,
        6,0,0,1023,1024,7,0,0,0,1024,1025,7,3,0,0,1025,1026,7,19,0,0,1026,
        1027,7,7,0,0,1027,1028,7,9,0,0,1028,1029,7,2,0,0,1029,1030,7,7,0,
        0,1030,1031,7,20,0,0,1031,114,1,0,0,0,1032,1033,7,16,0,0,1033,1034,
        7,12,0,0,1034,1035,7,6,0,0,1035,1036,7,4,0,0,1036,1037,7,8,0,0,1037,
        1038,7,6,0,0,1038,116,1,0,0,0,1039,1040,7,16,0,0,1040,1041,7,12,
        0,0,1041,1042,7,19,0,0,1042,1043,7,0,0,0,1043,1044,7,0,0,0,1044,
        118,1,0,0,0,1045,1046,7,16,0,0,1046,1047,7,17,0,0,1047,1048,7,5,
        0,0,1048,1049,7,6,0,0,1049,120,1,0,0,0,1050,1051,7,16,0,0,1051,1052,
        7,17,0,0,1052,1053,7,12,0,0,1053,1054,7,12,0,0,1054,1055,7,6,0,0,
        1055,1056,7,7,0,0,1056,1057,7,8,0,0,1057,122,1,0,0,0,1058,1059,7,
        16,0,0,1059,1060,7,17,0,0,1060,1061,7,12,0,0,1061,1062,7,12,0,0,
        1062,1063,7,6,0,0,1063,1064,7,7,0,0,1064,1065,7,8,0,0,1065,1066,
        5,95,0,0,1066,1067,7,16,0,0,1067,1068,7,4,0,0,1068,1069,7,8,0,0,
        1069,1070,7,4,0,0,1070,1071,7,13,0,0,1071,1072,7,19,0,0,1072,1073,
        7,20,0,0,1073,124,1,0,0,0,1074,1075,7,16,0,0,1075,1076,7,17,0,0,
        1076,1077,7,12,0,0,1077,1078,7,12,0,0,1078,1079,7,6,0,0,1079,1080,
        7,7,0,0,1080,1081,7,8,0,0,1081,1082,5,95,0,0,1082,1083,7,9,0,0,1083,
        1084,7,4,0,0,1084,1085,7,8,0,0,1085,1086,7,6,0,0,1086,126,1,0,0,
        0,1087,1088,7,16,0,0,1088,1089,7,17,0,0,1089,1090,7,12,0,0,1090,
        1091,7,12,0,0,1091,1092,7,6,0,0,1092,1093,7,7,0,0,1093,1094,7,8,
        0,0,1094,1095,5,95,0,0,1095,1096,7,3,0,0,1096,1097,7,4,0,0,1097,
        1098,7,8,0,0,1098,1099,7,18,0,0,1099,128,1,0,0,0,1100,1101,7,16,
        0,0,1101,1102,7,17,0,0,1102,1103,7,12,0,0,1103,1104,7,12,0,0,1104,
        1105,7,6,0,0,1105,1106,7,7,0,0,1106,1107,7,8,0,0,1107,1108,5,95,
        0,0,1108,1109,7,12,0,0,1109,1110,7,19,0,0,1110,1111,7,13,0,0,1111,
        1112,7,6,0,0,1112,130,1,0,0,0,1113,1114,7,16,0,0,1114,1115,7,17,
        0,0,1115,1116,7,12,0,0,1116,1117,7,12,0,0,1117,1118,7,6,0,0,1118,
        1119,7,7,0,0,1119,1120,7,8,0,0,1120,1121,5,95,0,0,1121,1122,7,0,
        0,0,1122,1123,7,16,0,0,1123,1124,7,18,0,0,1124,1125,7,6,0,0,1125,
        1126,7,10,0,0,1126,1127,7,4,0,0,1127,132,1,0,0,0,1128,1129,7,16,
        0,0,1129,1130,7,17,0,0,1130,1131,7,12,0,0,1131,1132,7,12,0,0,1132,
        1133,7,6,0,0,1133,1134,7,7,0,0,1134,1135,7,8,0,0,1135,1136,5,95,
        0,0,1136,1137,7,8,0,0,1137,1138,7,2,0,0,1138,1139,7,10,0,0,1139,
        1140,7,6,0,0,1140,134,1,0,0,0,1141,1142,7,16,0,0,1142,1143,7,17,
        0,0,1143,1144,7,12,0,0,1144,1145,7,12,0,0,1145,1146,7,6,0,0,1146,
        1147,7,7,0,0,1147,1148,7,8,0,0,1148,1149,5,95,0,0,1149,1150,7,8,
        0,0,1150,1151,7,2,0,0,1151,1152,7,10,0,0,1152,1153,7,6,0,0,1153,
        1154,7,0,0,0,1154,1155,7,8,0,0,1155,1156,7,4,0,0,1156,1157,7,10,
        0,0,1157,1158,7,3,0,0,1158,136,1,0,0,0,1159,1160,7,16,0,0,1160,1161,
        7,17,0,0,1161,1162,7,12,0,0,1162,1163,7,12,0,0,1163,1164,7,6,0,0,
        1164,1165,7,7,0,0,1165,1166,7,8,0,0,1166,1167,5,95,0,0,1167,1168,
        7,17,0,0,1168,1169,7,0,0,0,1169,1170,7,6,0,0,1170,1171,7,12,0,0,
        1171,138,1,0,0,0,1172,1173,7,9,0,0,1173,1174,7,4,0,0,1174,1175,7,
        8,0,0,1175,1176,7,4,0,0,1176,140,1,0,0,0,1177,1178,7,9,0,0,1178,
        1179,7,4,0,0,1179,1180,7,8,0,0,1180,1181,7,6,0,0,1181,142,1,0,0,
        0,1182,1183,7,9,0,0,1183,1184,7,4,0,0,1184,1185,7,14,0,0,1185,144,
        1,0,0,0,1186,1187,7,9,0,0,1187,1188,7,6,0,0,1188,1189,7,4,0,0,1189,
        1190,7,13,0,0,1190,1191,7,13,0,0,1191,1192,7,19,0,0,1192,1193,7,
        16,0,0,1193,1194,7,4,0,0,1194,1195,7,8,0,0,1195,1196,7,6,0,0,1196,
        146,1,0,0,0,1197,1198,7,9,0,0,1198,1199,7,6,0,0,1199,1200,7,16,0,
        0,1200,1201,7,13,0,0,1201,1202,7,4,0,0,1202,1203,7,12,0,0,1203,1204,
        7,6,0,0,1204,148,1,0,0,0,1205,1206,7,9,0,0,1206,1207,7,6,0,0,1207,
        1208,7,11,0,0,1208,1209,7,4,0,0,1209,1210,7,17,0,0,1210,1211,7,13,
        0,0,1211,1212,7,8,0,0,1212,150,1,0,0,0,1213,1214,7,9,0,0,1214,1215,
        7,6,0,0,1215,1216,7,11,0,0,1216,1217,7,2,0,0,1217,1218,7,7,0,0,1218,
        1219,7,6,0,0,1219,152,1,0,0,0,1220,1221,7,9,0,0,1221,1222,7,6,0,
        0,1222,1223,7,11,0,0,1223,1224,7,2,0,0,1224,1225,7,7,0,0,1225,1226,
        7,6,0,0,1226,1227,7,12,0,0,1227,154,1,0,0,0,1228,1229,7,9,0,0,1229,
        1230,7,6,0,0,1230,1231,7,13,0,0,1231,1232,7,6,0,0,1232,1233,7,8,
        0,0,1233,1234,7,6,0,0,1234,156,1,0,0,0,1235,1236,7,9,0,0,1236,1237,
        7,6,0,0,1237,1238,7,7,0,0,1238,1239,7,14,0,0,1239,158,1,0,0,0,1240,
        1241,7,9,0,0,1241,1242,7,6,0,0,1242,1243,7,0,0,0,1243,1244,7,16,
        0,0,1244,160,1,0,0,0,1245,1246,7,9,0,0,1246,1247,7,6,0,0,1247,1248,
        7,0,0,0,1248,1249,7,16,0,0,1249,1250,7,12,0,0,1250,1251,7,2,0,0,
        1251,1252,7,5,0,0,1252,1253,7,6,0,0,1253,162,1,0,0,0,1254,1255,7,
        9,0,0,1255,1256,7,6,0,0,1256,1257,7,0,0,0,1257,1258,7,16,0,0,1258,
        1259,7,12,0,0,1259,1260,7,2,0,0,1260,1261,7,3,0,0,1261,1262,7,8,
        0,0,1262,1263,7,19,0,0,1263,1264,7,12,0,0,1264,164,1,0,0,0,1265,
        1266,7,9,0,0,1266,1267,7,6,0,0,1267,1268,7,8,0,0,1268,1269,7,6,0,
        0,1269,1270,7,12,0,0,1270,1271,7,10,0,0,1271,1272,7,2,0,0,1272,1273,
        7,7,0,0,1273,1274,7,2,0,0,1274,1275,7,0,0,0,1275,1276,7,8,0,0,1276,
        1277,7,2,0,0,1277,1278,7,16,0,0,1278,166,1,0,0,0,1279,1280,7,9,0,
        0,1280,1281,7,2,0,0,1281,1282,7,0,0,0,1282,1283,7,8,0,0,1283,1284,
        7,2,0,0,1284,1285,7,7,0,0,1285,1286,7,16,0,0,1286,1287,7,8,0,0,1287,
        168,1,0,0,0,1288,1289,7,9,0,0,1289,1290,7,2,0,0,1290,1291,7,0,0,
        0,1291,1292,7,8,0,0,1292,1293,7,12,0,0,1293,1294,7,2,0,0,1294,1295,
        7,5,0,0,1295,1296,7,17,0,0,1296,1297,7,8,0,0,1297,1298,7,6,0,0,1298,
        1299,7,9,0,0,1299,170,1,0,0,0,1300,1301,7,9,0,0,1301,1302,7,19,0,
        0,1302,172,1,0,0,0,1303,1304,7,9,0,0,1304,1305,7,19,0,0,1305,1306,
        7,17,0,0,1306,1307,7,5,0,0,1307,1308,7,13,0,0,1308,1309,7,6,0,0,
        1309,174,1,0,0,0,1310,1311,7,9,0,0,1311,1312,7,12,0,0,1312,1313,
        7,19,0,0,1313,1314,7,3,0,0,1314,176,1,0,0,0,1315,1316,7,6,0,0,1316,
        1317,7,13,0,0,1317,1318,7,0,0,0,1318,1319,7,6,0,0,1319,178,1,0,0,
        0,1320,1321,7,6,0,0,1321,1322,7,10,0,0,1322,1323,7,3,0,0,1323,1324,
        7,8,0,0,1324,1325,7,14,0,0,1325,180,1,0,0,0,1326,1327,7,6,0,0,1327,
        1328,7,13,0,0,1328,1329,7,0,0,0,1329,1330,7,6,0,0,1330,1331,7,2,
        0,0,1331,1332,7,11,0,0,1332,182,1,0,0,0,1333,1334,7,6,0,0,1334,1335,
        7,7,0,0,1335,1336,7,16,0,0,1336,1337,7,19,0,0,1337,1338,7,9,0,0,
        1338,1339,7,2,0,0,1339,1340,7,7,0,0,1340,1341,7,20,0,0,1341,184,
        1,0,0,0,1342,1343,7,6,0,0,1343,1344,7,7,0,0,1344,1345,7,9,0,0,1345,
        186,1,0,0,0,1346,1347,7,6,0,0,1347,1348,7,12,0,0,1348,1349,7,12,
        0,0,1349,1350,7,19,0,0,1350,1351,7,12,0,0,1351,188,1,0,0,0,1352,
        1353,7,6,0,0,1353,1354,7,0,0,0,1354,1355,7,16,0,0,1355,1356,7,4,
        0,0,1356,1357,7,3,0,0,1357,1358,7,6,0,0,1358,190,1,0,0,0,1359,1360,
        7,6,0,0,1360,1361,7,22,0,0,1361,1362,7,16,0,0,1362,1363,7,6,0,0,
        1363,1364,7,3,0,0,1364,1365,7,8,0,0,1365,192,1,0,0,0,1366,1367,7,
        6,0,0,1367,1368,7,22,0,0,1368,1369,7,16,0,0,1369,1370,7,13,0,0,1370,
        1371,7,17,0,0,1371,1372,7,9,0,0,1372,1373,7,2,0,0,1373,1374,7,7,
        0,0,1374,1375,7,20,0,0,1375,194,1,0,0,0,1376,1377,7,6,0,0,1377,1378,
        7,22,0,0,1378,1379,7,6,0,0,1379,1380,7,16,0,0,1380,1381,7,17,0,0,
        1381,1382,7,8,0,0,1382,1383,7,6,0,0,1383,196,1,0,0,0,1384,1385,7,
        6,0,0,1385,1386,7,22,0,0,1386,1387,7,2,0,0,1387,1388,7,0,0,0,1388,
        1389,7,8,0,0,1389,1390,7,0,0,0,1390,198,1,0,0,0,1391,1392,7,6,0,
        0,1392,1393,7,22,0,0,1393,1394,7,3,0,0,1394,1395,7,13,0,0,1395,1396,
        7,4,0,0,1396,1397,7,2,0,0,1397,1398,7,7,0,0,1398,200,1,0,0,0,1399,
        1400,7,6,0,0,1400,1401,7,22,0,0,1401,1402,7,8,0,0,1402,1403,7,12,
        0,0,1403,1404,7,4,0,0,1404,1405,7,16,0,0,1405,1406,7,8,0,0,1406,
        202,1,0,0,0,1407,1408,7,11,0,0,1408,1409,7,4,0,0,1409,1410,7,2,0,
        0,1410,1411,7,13,0,0,1411,204,1,0,0,0,1412,1413,7,11,0,0,1413,1414,
        7,4,0,0,1414,1415,7,13,0,0,1415,1416,7,0,0,0,1416,1417,7,6,0,0,1417,
        206,1,0,0,0,1418,1419,7,11,0,0,1419,1420,7,4,0,0,1420,1421,7,0,0,
        0,1421,1422,7,8,0,0,1422,208,1,0,0,0,1423,1424,7,11,0,0,1424,1425,
        7,6,0,0,1425,1426,7,8,0,0,1426,1427,7,16,0,0,1427,1428,7,18,0,0,
        1428,210,1,0,0,0,1429,1430,7,11,0,0,1430,1431,7,2,0,0,1431,1432,
        7,13,0,0,1432,1433,7,8,0,0,1433,1434,7,6,0,0,1434,1435,7,12,0,0,
        1435,212,1,0,0,0,1436,1437,7,11,0,0,1437,1438,7,2,0,0,1438,1439,
        7,7,0,0,1439,1440,7,4,0,0,1440,1441,7,13,0,0,1441,214,1,0,0,0,1442,
        1443,7,11,0,0,1443,1444,7,2,0,0,1444,1445,7,12,0,0,1445,1446,7,0,
        0,0,1446,1447,7,8,0,0,1447,216,1,0,0,0,1448,1449,7,11,0,0,1449,1450,
        7,19,0,0,1450,1451,7,13,0,0,1451,1452,7,13,0,0,1452,1453,7,19,0,
        0,1453,1454,7,21,0,0,1454,1455,7,2,0,0,1455,1456,7,7,0,0,1456,1457,
        7,20,0,0,1457,218,1,0,0,0,1458,1459,7,11,0,0,1459,1460,7,19,0,0,
        1460,1461,7,12,0,0,1461,220,1,0,0,0,1462,1463,7,11,0,0,1463,1464,
        7,19,0,0,1464,1465,7,12,0,0,1465,1466,7,10,0,0,1466,1467,7,4,0,0,
        1467,1468,7,8,0,0,1468,222,1,0,0,0,1469,1470,7,11,0,0,1470,1471,
        7,19,0,0,1471,1472,7,12,0,0,1472,1473,7,21,0,0,1473,1474,7,4,0,0,
        1474,1475,7,12,0,0,1475,1476,7,9,0,0,1476,224,1,0,0,0,1477,1478,
        7,11,0,0,1478,1479,7,12,0,0,1479,1480,7,19,0,0,1480,1481,7,10,0,
        0,1481,226,1,0,0,0,1482,1483,7,11,0,0,1483,1484,7,17,0,0,1484,1485,
        7,13,0,0,1485,1486,7,13,0,0,1486,228,1,0,0,0,1487,1488,7,11,0,0,
        1488,1489,7,17,0,0,1489,1490,7,7,0,0,1490,1491,7,16,0,0,1491,1492,
        7,8,0,0,1492,1493,7,2,0,0,1493,1494,7,19,0,0,1494,1495,7,7,0,0,1495,
        230,1,0,0,0,1496,1497,7,11,0,0,1497,1498,7,17,0,0,1498,1499,7,7,
        0,0,1499,1500,7,16,0,0,1500,1501,7,8,0,0,1501,1502,7,2,0,0,1502,
        1503,7,19,0,0,1503,1504,7,7,0,0,1504,1505,7,0,0,0,1505,232,1,0,0,
        0,1506,1507,7,20,0,0,1507,1508,7,12,0,0,1508,1509,7,4,0,0,1509,1510,
        7,16,0,0,1510,1511,7,6,0,0,1511,234,1,0,0,0,1512,1513,7,20,0,0,1513,
        1514,7,12,0,0,1514,1515,7,4,0,0,1515,1516,7,7,0,0,1516,1517,7,8,
        0,0,1517,236,1,0,0,0,1518,1519,7,20,0,0,1519,1520,7,12,0,0,1520,
        1521,7,4,0,0,1521,1522,7,7,0,0,1522,1523,7,8,0,0,1523,1524,7,6,0,
        0,1524,1525,7,9,0,0,1525,238,1,0,0,0,1526,1527,7,20,0,0,1527,1528,
        7,12,0,0,1528,1529,7,4,0,0,1529,1530,7,7,0,0,1530,1531,7,8,0,0,1531,
        1532,7,0,0,0,1532,240,1,0,0,0,1533,1534,7,20,0,0,1534,1535,7,12,
        0,0,1535,1536,7,4,0,0,1536,1537,7,3,0,0,1537,1538,7,18,0,0,1538,
        1539,7,23,0,0,1539,1540,7,2,0,0,1540,1541,7,15,0,0,1541,242,1,0,
        0,0,1542,1543,7,20,0,0,1543,1544,7,12,0,0,1544,1545,7,19,0,0,1545,
        1546,7,17,0,0,1546,1547,7,3,0,0,1547,244,1,0,0,0,1548,1549,7,20,
        0,0,1549,1550,7,12,0,0,1550,1551,7,19,0,0,1551,1552,7,17,0,0,1552,
        1553,7,3,0,0,1553,1554,7,2,0,0,1554,1555,7,7,0,0,1555,1556,7,20,
        0,0,1556,246,1,0,0,0,1557,1558,7,20,0,0,1558,1559,7,12,0,0,1559,
        1560,7,19,0,0,1560,1561,7,17,0,0,1561,1562,7,3,0,0,1562,1563,7,0,
        0,0,1563,248,1,0,0,0,1564,1565,7,18,0,0,1565,1566,7,4,0,0,1566,1567,
        7,23,0,0,1567,1568,7,2,0,0,1568,1569,7,7,0,0,1569,1570,7,20,0,0,
        1570,250,1,0,0,0,1571,1572,7,18,0,0,1572,1573,7,19,0,0,1573,1574,
        7,17,0,0,1574,1575,7,12,0,0,1575,252,1,0,0,0,1576,1577,7,2,0,0,1577,
        1578,7,11,0,0,1578,254,1,0,0,0,1579,1580,7,2,0,0,1580,1581,7,20,
        0,0,1581,1582,7,7,0,0,1582,1583,7,19,0,0,1583,1584,7,12,0,0,1584,
        1585,7,6,0,0,1585,256,1,0,0,0,1586,1587,7,2,0,0,1587,1588,7,10,0,
        0,1588,1589,7,10,0,0,1589,1590,7,6,0,0,1590,1591,7,9,0,0,1591,1592,
        7,2,0,0,1592,1593,7,4,0,0,1593,1594,7,8,0,0,1594,1595,7,6,0,0,1595,
        258,1,0,0,0,1596,1597,7,2,0,0,1597,1598,7,7,0,0,1598,260,1,0,0,0,
        1599,1600,7,2,0,0,1600,1601,7,7,0,0,1601,1602,7,16,0,0,1602,1603,
        7,13,0,0,1603,1604,7,17,0,0,1604,1605,7,9,0,0,1605,1606,7,2,0,0,
        1606,1607,7,7,0,0,1607,1608,7,20,0,0,1608,262,1,0,0,0,1609,1610,
        7,2,0,0,1610,1611,7,7,0,0,1611,1612,7,2,0,0,1612,1613,7,8,0,0,1613,
        1614,7,2,0,0,1614,1615,7,4,0,0,1615,1616,7,13,0,0,1616,264,1,0,0,
        0,1617,1618,7,2,0,0,1618,1619,7,7,0,0,1619,1620,7,13,0,0,1620,1621,
        7,2,0,0,1621,1622,7,7,0,0,1622,1623,7,6,0,0,1623,266,1,0,0,0,1624,
        1625,7,2,0,0,1625,1626,7,7,0,0,1626,1627,7,7,0,0,1627,1628,7,6,0,
        0,1628,1629,7,12,0,0,1629,268,1,0,0,0,1630,1631,7,2,0,0,1631,1632,
        7,7,0,0,1632,1633,7,3,0,0,1633,1634,7,17,0,0,1634,1635,7,8,0,0,1635,
        270,1,0,0,0,1636,1637,7,2,0,0,1637,1638,7,7,0,0,1638,1639,7,0,0,
        0,1639,1640,7,6,0,0,1640,1641,7,12,0,0,1641,1642,7,8,0,0,1642,272,
        1,0,0,0,1643,1644,7,2,0,0,1644,1645,7,7,0,0,1645,1646,7,8,0,0,1646,
        1647,7,6,0,0,1647,1648,7,12,0,0,1648,1649,7,0,0,0,1649,1650,7,6,
        0,0,1650,1651,7,16,0,0,1651,1652,7,8,0,0,1652,274,1,0,0,0,1653,1654,
        7,2,0,0,1654,1655,7,7,0,0,1655,1656,7,8,0,0,1656,1657,7,6,0,0,1657,
        1658,7,12,0,0,1658,1659,7,23,0,0,1659,1660,7,4,0,0,1660,1661,7,13,
        0,0,1661,276,1,0,0,0,1662,1663,7,2,0,0,1663,1664,7,7,0,0,1664,1665,
        7,8,0,0,1665,1666,7,19,0,0,1666,278,1,0,0,0,1667,1668,7,2,0,0,1668,
        1669,7,7,0,0,1669,1670,7,23,0,0,1670,1671,7,19,0,0,1671,1672,7,1,
        0,0,1672,1673,7,6,0,0,1673,1674,7,12,0,0,1674,280,1,0,0,0,1675,1676,
        7,2,0,0,1676,1677,7,19,0,0,1677,282,1,0,0,0,1678,1679,7,2,0,0,1679,
        1680,7,0,0,0,1680,284,1,0,0,0,1681,1682,7,2,0,0,1682,1683,7,0,0,
        0,1683,1684,7,19,0,0,1684,1685,7,13,0,0,1685,1686,7,4,0,0,1686,1687,
        7,8,0,0,1687,1688,7,2,0,0,1688,1689,7,19,0,0,1689,1690,7,7,0,0,1690,
        286,1,0,0,0,1691,1692,7,2,0,0,1692,1693,7,8,0,0,1693,1694,7,6,0,
        0,1694,1695,7,12,0,0,1695,1696,7,4,0,0,1696,1697,7,8,0,0,1697,1698,
        7,6,0,0,1698,288,1,0,0,0,1699,1700,7,24,0,0,1700,1701,7,19,0,0,1701,
        1702,7,2,0,0,1702,1703,7,7,0,0,1703,290,1,0,0,0,1704,1705,7,24,0,
        0,1705,1706,7,0,0,0,1706,1707,7,19,0,0,1707,1708,7,7,0,0,1708,292,
        1,0,0,0,1709,1710,7,24,0,0,1710,1711,7,0,0,0,1711,1712,7,19,0,0,
        1712,1713,7,7,0,0,1713,1714,5,95,0,0,1714,1715,7,4,0,0,1715,1716,
        7,12,0,0,1716,1717,7,12,0,0,1717,1718,7,4,0,0,1718,1719,7,14,0,0,
        1719,294,1,0,0,0,1720,1721,7,24,0,0,1721,1722,7,0,0,0,1722,1723,
        7,19,0,0,1723,1724,7,7,0,0,1724,1725,5,95,0,0,1725,1726,7,6,0,0,
        1726,1727,7,22,0,0,1727,1728,7,2,0,0,1728,1729,7,0,0,0,1729,1730,
        7,8,0,0,1730,1731,7,0,0,0,1731,296,1,0,0,0,1732,1733,7,24,0,0,1733,
        1734,7,0,0,0,1734,1735,7,19,0,0,1735,1736,7,7,0,0,1736,1737,5,95,
        0,0,1737,1738,7,19,0,0,1738,1739,7,5,0,0,1739,1740,7,24,0,0,1740,
        1741,7,6,0,0,1741,1742,7,16,0,0,1742,1743,7,8,0,0,1743,298,1,0,0,
        0,1744,1745,7,24,0,0,1745,1746,7,0,0,0,1746,1747,7,19,0,0,1747,1748,
        7,7,0,0,1748,1749,5,95,0,0,1749,1750,7,25,0,0,1750,1751,7,17,0,0,
        1751,1752,7,6,0,0,1752,1753,7,12,0,0,1753,1754,7,14,0,0,1754,300,
        1,0,0,0,1755,1756,7,24,0,0,1756,1757,7,0,0,0,1757,1758,7,19,0,0,
        1758,1759,7,7,0,0,1759,1760,5,95,0,0,1760,1761,7,8,0,0,1761,1762,
        7,4,0,0,1762,1763,7,5,0,0,1763,1764,7,13,0,0,1764,1765,7,6,0,0,1765,
        302,1,0,0,0,1766,1767,7,24,0,0,1767,1768,7,0,0,0,1768,1769,7,19,
        0,0,1769,1770,7,7,0,0,1770,1771,5,95,0,0,1771,1772,7,23,0,0,1772,
        1773,7,4,0,0,1773,1774,7,13,0,0,1774,1775,7,17,0,0,1775,1776,7,6,
        0,0,1776,304,1,0,0,0,1777,1778,7,1,0,0,1778,1779,7,6,0,0,1779,1780,
        7,6,0,0,1780,1781,7,3,0,0,1781,306,1,0,0,0,1782,1783,7,1,0,0,1783,
        1784,7,6,0,0,1784,1785,7,14,0,0,1785,308,1,0,0,0,1786,1787,7,1,0,
        0,1787,1788,7,6,0,0,1788,1789,7,14,0,0,1789,1790,7,0,0,0,1790,310,
        1,0,0,0,1791,1792,7,13,0,0,1792,1793,7,4,0,0,1793,1794,7,7,0,0,1794,
        1795,7,20,0,0,1795,1796,7,17,0,0,1796,1797,7,4,0,0,1797,1798,7,20,
        0,0,1798,1799,7,6,0,0,1799,312,1,0,0,0,1800,1801,7,13,0,0,1801,1802,
        7,4,0,0,1802,1803,7,0,0,0,1803,1804,7,8,0,0,1804,314,1,0,0,0,1805,
        1806,7,13,0,0,1806,1807,7,4,0,0,1807,1808,7,8,0,0,1808,1809,7,6,
        0,0,1809,1810,7,12,0,0,1810,1811,7,4,0,0,1811,1812,7,13,0,0,1812,
        316,1,0,0,0,1813,1814,7,13,0,0,1814,1815,7,6,0,0,1815,1816,7,4,0,
        0,1816,1817,7,9,0,0,1817,1818,7,2,0,0,1818,1819,7,7,0,0,1819,1820,
        7,20,0,0,1820,318,1,0,0,0,1821,1822,7,13,0,0,1822,1823,7,6,0,0,1823,
        1824,7,4,0,0,1824,1825,7,23,0,0,1825,1826,7,6,0,0,1826,320,1,0,0,
        0,1827,1828,7,13,0,0,1828,1829,7,6,0,0,1829,1830,7,11,0,0,1830,1831,
        7,8,0,0,1831,322,1,0,0,0,1832,1833,7,13,0,0,1833,1834,7,6,0,0,1834,
        1835,7,23,0,0,1835,1836,7,6,0,0,1836,1837,7,13,0,0,1837,324,1,0,
        0,0,1838,1839,7,13,0,0,1839,1840,7,2,0,0,1840,1841,7,1,0,0,1841,
        1842,7,6,0,0,1842,326,1,0,0,0,1843,1844,7,13,0,0,1844,1845,7,2,0,
        0,1845,1846,7,10,0,0,1846,1847,7,2,0,0,1847,1848,7,8,0,0,1848,328,
        1,0,0,0,1849,1850,7,13,0,0,1850,1851,7,2,0,0,1851,1852,7,0,0,0,1852,
        1853,7,8,0,0,1853,1854,7,4,0,0,1854,1855,7,20,0,0,1855,1856,7,20,
        0,0,1856,330,1,0,0,0,1857,1858,7,13,0,0,1858,1859,7,19,0,0,1859,
        1860,7,16,0,0,1860,1861,7,4,0,0,1861,1862,7,13,0,0,1862,332,1,0,
        0,0,1863,1864,7,13,0,0,1864,1865,7,19,0,0,1865,1866,7,16,0,0,1866,
        1867,7,4,0,0,1867,1868,7,13,0,0,1868,1869,7,8,0,0,1869,1870,7,2,
        0,0,1870,1871,7,10,0,0,1871,1872,7,6,0,0,1872,334,1,0,0,0,1873,1874,
        7,13,0,0,1874,1875,7,19,0,0,1875,1876,7,16,0,0,1876,1877,7,4,0,0,
        1877,1878,7,13,0,0,1878,1879,7,8,0,0,1879,1880,7,2,0,0,1880,1881,
        7,10,0,0,1881,1882,7,6,0,0,1882,1883,7,0,0,0,1883,1884,7,8,0,0,1884,
        1885,7,4,0,0,1885,1886,7,10,0,0,1886,1887,7,3,0,0,1887,336,1,0,0,
        0,1888,1889,7,13,0,0,1889,1890,7,19,0,0,1890,1891,7,20,0,0,1891,
        1892,7,2,0,0,1892,1893,7,16,0,0,1893,1894,7,4,0,0,1894,1895,7,13,
        0,0,1895,338,1,0,0,0,1896,1897,7,13,0,0,1897,1898,7,19,0,0,1898,
        1899,7,19,0,0,1899,1900,7,3,0,0,1900,340,1,0,0,0,1901,1902,7,10,
        0,0,1902,1903,7,4,0,0,1903,1904,7,3,0,0,1904,342,1,0,0,0,1905,1906,
        7,10,0,0,1906,1907,7,4,0,0,1907,1908,7,8,0,0,1908,1909,7,16,0,0,
        1909,1910,7,18,0,0,1910,344,1,0,0,0,1911,1912,7,10,0,0,1912,1913,
        7,4,0,0,1913,1914,7,8,0,0,1914,1915,7,16,0,0,1915,1916,7,18,0,0,
        1916,1917,7,6,0,0,1917,1918,7,9,0,0,1918,346,1,0,0,0,1919,1920,7,
        10,0,0,1920,1921,7,4,0,0,1921,1922,7,8,0,0,1922,1923,7,16,0,0,1923,
        1924,7,18,0,0,1924,1925,7,6,0,0,1925,1926,7,0,0,0,1926,348,1,0,0,
        0,1927,1928,7,10,0,0,1928,1929,7,4,0,0,1929,1930,7,8,0,0,1930,1931,
        7,16,0,0,1931,1932,7,18,0,0,1932,1933,5,95,0,0,1933,1934,7,12,0,
        0,1934,1935,7,6,0,0,1935,1936,7,16,0,0,1936,1937,7,19,0,0,1937,1938,
        7,20,0,0,1938,1939,7,7,0,0,1939,1940,7,2,0,0,1940,1941,7,15,0,0,
        1941,1942,7,6,0,0,1942,350,1,0,0,0,1943,1944,7,10,0,0,1944,1945,
        7,4,0,0,1945,1946,7,8,0,0,1946,1947,7,6,0,0,1947,1948,7,12,0,0,1948,
        1949,7,2,0,0,1949,1950,7,4,0,0,1950,1951,7,13,0,0,1951,1952,7,2,
        0,0,1952,1953,7,15,0,0,1953,1954,7,6,0,0,1954,1955,7,9,0,0,1955,
        352,1,0,0,0,1956,1957,7,10,0,0,1957,1958,7,6,0,0,1958,1959,7,4,0,
        0,1959,1960,7,0,0,0,1960,1961,7,17,0,0,1961,1962,7,12,0,0,1962,1963,
        7,6,0,0,1963,1964,7,0,0,0,1964,354,1,0,0,0,1965,1966,7,10,0,0,1966,
        1967,7,6,0,0,1967,1968,7,12,0,0,1968,1969,7,20,0,0,1969,1970,7,6,
        0,0,1970,356,1,0,0,0,1971,1972,7,10,0,0,1972,1973,7,2,0,0,1973,1974,
        7,7,0,0,1974,1975,7,17,0,0,1975,1976,7,8,0,0,1976,1977,7,6,0,0,1977,
        358,1,0,0,0,1978,1979,7,10,0,0,1979,1980,7,19,0,0,1980,1981,7,7,
        0,0,1981,1982,7,8,0,0,1982,1983,7,18,0,0,1983,360,1,0,0,0,1984,1985,
        7,7,0,0,1985,1986,7,4,0,0,1986,1987,7,8,0,0,1987,1988,7,17,0,0,1988,
        1989,7,12,0,0,1989,1990,7,4,0,0,1990,1991,7,13,0,0,1991,362,1,0,
        0,0,1992,1993,7,7,0,0,1993,1994,7,6,0,0,1994,1995,7,0,0,0,1995,1996,
        7,8,0,0,1996,1997,7,6,0,0,1997,1998,7,9,0,0,1998,364,1,0,0,0,1999,
        2000,7,7,0,0,2000,2001,7,6,0,0,2001,2002,7,22,0,0,2002,2003,7,8,
        0,0,2003,366,1,0,0,0,2004,2005,7,7,0,0,2005,2006,7,11,0,0,2006,2007,
        7,16,0,0,2007,368,1,0,0,0,2008,2009,7,7,0,0,2009,2010,7,11,0,0,2010,
        2011,7,9,0,0,2011,370,1,0,0,0,2012,2013,7,7,0,0,2013,2014,7,11,0,
        0,2014,2015,7,1,0,0,2015,2016,7,16,0,0,2016,372,1,0,0,0,2017,2018,
        7,7,0,0,2018,2019,7,11,0,0,2019,2020,7,1,0,0,2020,2021,7,9,0,0,2021,
        374,1,0,0,0,2022,2023,7,7,0,0,2023,2024,7,19,0,0,2024,376,1,0,0,
        0,2025,2026,7,7,0,0,2026,2027,7,19,0,0,2027,2028,7,7,0,0,2028,2029,
        7,6,0,0,2029,378,1,0,0,0,2030,2031,7,7,0,0,2031,2032,7,19,0,0,2032,
        2033,7,12,0,0,2033,2034,7,10,0,0,2034,2035,7,4,0,0,2035,2036,7,13,
        0,0,2036,2037,7,2,0,0,2037,2038,7,15,0,0,2038,2039,7,6,0,0,2039,
        380,1,0,0,0,2040,2041,7,7,0,0,2041,2042,7,19,0,0,2042,2043,7,8,0,
        0,2043,382,1,0,0,0,2044,2045,7,7,0,0,2045,2046,7,17,0,0,2046,2047,
        7,13,0,0,2047,2048,7,13,0,0,2048,384,1,0,0,0,2049,2050,7,7,0,0,2050,
        2051,7,17,0,0,2051,2052,7,13,0,0,2052,2053,7,13,0,0,2053,2054,7,
        2,0,0,2054,2055,7,11,0,0,2055,386,1,0,0,0,2056,2057,7,7,0,0,2057,
        2058,7,17,0,0,2058,2059,7,13,0,0,2059,2060,7,13,0,0,2060,2061,7,
        0,0,0,2061,388,1,0,0,0,2062,2063,7,19,0,0,2063,2064,7,5,0,0,2064,
        2065,7,24,0,0,2065,2066,7,6,0,0,2066,2067,7,16,0,0,2067,2068,7,8,
        0,0,2068,390,1,0,0,0,2069,2070,7,19,0,0,2070,2071,7,11,0,0,2071,
        392,1,0,0,0,2072,2073,7,19,0,0,2073,2074,7,11,0,0,2074,2075,7,11,
        0,0,2075,2076,7,0,0,0,2076,2077,7,6,0,0,2077,2078,7,8,0,0,2078,394,
        1,0,0,0,2079,2080,7,19,0,0,2080,2081,7,10,0,0,2081,2082,7,2,0,0,
        2082,2083,7,8,0,0,2083,396,1,0,0,0,2084,2085,7,19,0,0,2085,2086,
        7,7,0,0,2086,398,1,0,0,0,2087,2088,7,19,0,0,2088,2089,7,7,0,0,2089,
        2090,7,6,0,0,2090,400,1,0,0,0,2091,2092,7,19,0,0,2092,2093,7,7,0,
        0,2093,2094,7,13,0,0,2094,2095,7,14,0,0,2095,402,1,0,0,0,2096,2097,
        7,19,0,0,2097,2098,7,3,0,0,2098,2099,7,8,0,0,2099,2100,7,2,0,0,2100,
        2101,7,19,0,0,2101,2102,7,7,0,0,2102,404,1,0,0,0,2103,2104,7,19,
        0,0,2104,2105,7,12,0,0,2105,406,1,0,0,0,2106,2107,7,19,0,0,2107,
        2108,7,12,0,0,2108,2109,7,9,0,0,2109,2110,7,6,0,0,2110,2111,7,12,
        0,0,2111,408,1,0,0,0,2112,2113,7,19,0,0,2113,2114,7,12,0,0,2114,
        2115,7,9,0,0,2115,2116,7,2,0,0,2116,2117,7,7,0,0,2117,2118,7,4,0,
        0,2118,2119,7,13,0,0,2119,2120,7,2,0,0,2120,2121,7,8,0,0,2121,2122,
        7,14,0,0,2122,410,1,0,0,0,2123,2124,7,19,0,0,2124,2125,7,17,0,0,
        2125,2126,7,8,0,0,2126,2127,7,6,0,0,2127,2128,7,12,0,0,2128,412,
        1,0,0,0,2129,2130,7,19,0,0,2130,2131,7,17,0,0,2131,2132,7,8,0,0,
        2132,2133,7,3,0,0,2133,2134,7,17,0,0,2134,2135,7,8,0,0,2135,414,
        1,0,0,0,2136,2137,7,19,0,0,2137,2138,7,23,0,0,2138,2139,7,6,0,0,
        2139,2140,7,12,0,0,2140,416,1,0,0,0,2141,2142,7,19,0,0,2142,2143,
        7,23,0,0,2143,2144,7,6,0,0,2144,2145,7,12,0,0,2145,2146,7,11,0,0,
        2146,2147,7,13,0,0,2147,2148,7,19,0,0,2148,2149,7,21,0,0,2149,418,
        1,0,0,0,2150,2151,7,3,0,0,2151,2152,7,4,0,0,2152,2153,7,12,0,0,2153,
        2154,7,8,0,0,2154,2155,7,2,0,0,2155,2156,7,8,0,0,2156,2157,7,2,0,
        0,2157,2158,7,19,0,0,2158,2159,7,7,0,0,2159,420,1,0,0,0,2160,2161,
        7,3,0,0,2161,2162,7,4,0,0,2162,2163,7,12,0,0,2163,2164,7,8,0,0,2164,
        2165,7,2,0,0,2165,2166,7,8,0,0,2166,2167,7,2,0,0,2167,2168,7,19,
        0,0,2168,2169,7,7,0,0,2169,2170,7,0,0,0,2170,422,1,0,0,0,2171,2172,
        7,3,0,0,2172,2173,7,4,0,0,2173,2174,7,0,0,0,2174,2175,7,0,0,0,2175,
        2176,7,2,0,0,2176,2177,7,7,0,0,2177,2178,7,20,0,0,2178,424,1,0,0,
        0,2179,2180,7,3,0,0,2180,2181,7,4,0,0,2181,2182,7,0,0,0,2182,2183,
        7,8,0,0,2183,426,1,0,0,0,2184,2185,7,3,0,0,2185,2186,7,4,0,0,2186,
        2187,7,8,0,0,2187,2188,7,18,0,0,2188,428,1,0,0,0,2189,2190,7,3,0,
        0,2190,2191,7,4,0,0,2191,2192,7,8,0,0,2192,2193,7,8,0,0,2193,2194,
        7,6,0,0,2194,2195,7,12,0,0,2195,2196,7,7,0,0,2196,430,1,0,0,0,2197,
        2198,7,3,0,0,2198,2199,7,6,0,0,2199,2200,7,12,0,0,2200,432,1,0,0,
        0,2201,2202,7,3,0,0,2202,2203,7,6,0,0,2203,2204,7,12,0,0,2204,2205,
        7,2,0,0,2205,2206,7,19,0,0,2206,2207,7,9,0,0,2207,434,1,0,0,0,2208,
        2209,7,3,0,0,2209,2210,7,6,0,0,2210,2211,7,12,0,0,2211,2212,7,10,
        0,0,2212,2213,7,17,0,0,2213,2214,7,8,0,0,2214,2215,7,6,0,0,2215,
        436,1,0,0,0,2216,2217,7,3,0,0,2217,2218,7,13,0,0,2218,2219,7,4,0,
        0,2219,2220,7,7,0,0,2220,438,1,0,0,0,2221,2222,7,3,0,0,2222,2223,
        7,19,0,0,2223,2224,7,0,0,0,2224,2225,7,2,0,0,2225,2226,7,8,0,0,2226,
        2227,7,2,0,0,2227,2228,7,19,0,0,2228,2229,7,7,0,0,2229,440,1,0,0,
        0,2230,2231,7,3,0,0,2231,2232,7,12,0,0,2232,2233,7,6,0,0,2233,2234,
        7,16,0,0,2234,2235,7,6,0,0,2235,2236,7,9,0,0,2236,2237,7,2,0,0,2237,
        2238,7,7,0,0,2238,2239,7,20,0,0,2239,442,1,0,0,0,2240,2241,7,3,0,
        0,2241,2242,7,12,0,0,2242,2243,7,6,0,0,2243,2244,7,16,0,0,2244,2245,
        7,2,0,0,2245,2246,7,0,0,0,2246,2247,7,2,0,0,2247,2248,7,19,0,0,2248,
        2249,7,7,0,0,2249,444,1,0,0,0,2250,2251,7,3,0,0,2251,2252,7,12,0,
        0,2252,2253,7,6,0,0,2253,2254,7,3,0,0,2254,2255,7,4,0,0,2255,2256,
        7,12,0,0,2256,2257,7,6,0,0,2257,446,1,0,0,0,2258,2259,7,3,0,0,2259,
        2260,7,12,0,0,2260,2261,7,2,0,0,2261,2262,7,23,0,0,2262,2263,7,2,
        0,0,2263,2264,7,13,0,0,2264,2265,7,6,0,0,2265,2266,7,20,0,0,2266,
        2267,7,6,0,0,2267,2268,7,0,0,0,2268,448,1,0,0,0,2269,2270,7,3,0,
        0,2270,2271,7,12,0,0,2271,2272,7,19,0,0,2272,2273,7,3,0,0,2273,2274,
        7,6,0,0,2274,2275,7,12,0,0,2275,2276,7,8,0,0,2276,2277,7,2,0,0,2277,
        2278,7,6,0,0,2278,2279,7,0,0,0,2279,450,1,0,0,0,2280,2281,7,3,0,
        0,2281,2282,7,12,0,0,2282,2283,7,17,0,0,2283,2284,7,7,0,0,2284,2285,
        7,6,0,0,2285,452,1,0,0,0,2286,2287,7,25,0,0,2287,2288,7,17,0,0,2288,
        2289,7,19,0,0,2289,2290,7,8,0,0,2290,2291,7,6,0,0,2291,2292,7,0,
        0,0,2292,454,1,0,0,0,2293,2294,7,12,0,0,2294,2295,7,4,0,0,2295,2296,
        7,7,0,0,2296,2297,7,20,0,0,2297,2298,7,6,0,0,2298,456,1,0,0,0,2299,
        2300,7,12,0,0,2300,2301,7,6,0,0,2301,2302,7,4,0,0,2302,2303,7,9,
        0,0,2303,458,1,0,0,0,2304,2305,7,12,0,0,2305,2306,7,6,0,0,2306,2307,
        7,16,0,0,2307,2308,7,17,0,0,2308,2309,7,12,0,0,2309,2310,7,0,0,0,
        2310,2311,7,2,0,0,2311,2312,7,23,0,0,2312,2313,7,6,0,0,2313,460,
        1,0,0,0,2314,2315,7,12,0,0,2315,2316,7,6,0,0,2316,2317,7,11,0,0,
        2317,2318,7,12,0,0,2318,2319,7,6,0,0,2319,2320,7,0,0,0,2320,2321,
        7,18,0,0,2321,462,1,0,0,0,2322,2323,7,12,0,0,2323,2324,7,6,0,0,2324,
        2325,7,7,0,0,2325,2326,7,4,0,0,2326,2327,7,10,0,0,2327,2328,7,6,
        0,0,2328,464,1,0,0,0,2329,2330,7,12,0,0,2330,2331,7,6,0,0,2331,2332,
        7,3,0,0,2332,2333,7,6,0,0,2333,2334,7,4,0,0,2334,2335,7,8,0,0,2335,
        466,1,0,0,0,2336,2337,7,12,0,0,2337,2338,7,6,0,0,2338,2339,7,3,0,
        0,2339,2340,7,6,0,0,2340,2341,7,4,0,0,2341,2342,7,8,0,0,2342,2343,
        7,4,0,0,2343,2344,7,5,0,0,2344,2345,7,13,0,0,2345,2346,7,6,0,0,2346,
        468,1,0,0,0,2347,2348,7,12,0,0,2348,2349,7,6,0,0,2349,2350,7,3,0,
        0,2350,2351,7,13,0,0,2351,2352,7,4,0,0,2352,2353,7,16,0,0,2353,2354,
        7,6,0,0,2354,470,1,0,0,0,2355,2356,7,12,0,0,2356,2357,7,6,0,0,2357,
        2358,7,0,0,0,2358,2359,7,6,0,0,2359,2360,7,8,0,0,2360,472,1,0,0,
        0,2361,2362,7,12,0,0,2362,2363,7,6,0,0,2363,2364,7,0,0,0,2364,2365,
        7,3,0,0,2365,2366,7,6,0,0,2366,2367,7,16,0,0,2367,2368,7,8,0,0,2368,
        474,1,0,0,0,2369,2370,7,12,0,0,2370,2371,7,6,0,0,2371,2372,7,0,0,
        0,2372,2373,7,8,0,0,2373,2374,7,12,0,0,2374,2375,7,2,0,0,2375,2376,
        7,16,0,0,2376,2377,7,8,0,0,2377,476,1,0,0,0,2378,2379,7,12,0,0,2379,
        2380,7,6,0,0,2380,2381,7,8,0,0,2381,2382,7,17,0,0,2382,2383,7,12,
        0,0,2383,2384,7,7,0,0,2384,478,1,0,0,0,2385,2386,7,12,0,0,2386,2387,
        7,6,0,0,2387,2388,7,8,0,0,2388,2389,7,17,0,0,2389,2390,7,12,0,0,
        2390,2391,7,7,0,0,2391,2392,7,2,0,0,2392,2393,7,7,0,0,2393,2394,
        7,20,0,0,2394,480,1,0,0,0,2395,2396,7,12,0,0,2396,2397,7,6,0,0,2397,
        2398,7,8,0,0,2398,2399,7,17,0,0,2399,2400,7,12,0,0,2400,2401,7,7,
        0,0,2401,2402,7,0,0,0,2402,482,1,0,0,0,2403,2404,7,12,0,0,2404,2405,
        7,6,0,0,2405,2406,7,23,0,0,2406,2407,7,19,0,0,2407,2408,7,1,0,0,
        2408,2409,7,6,0,0,2409,484,1,0,0,0,2410,2411,7,12,0,0,2411,2412,
        7,2,0,0,2412,2413,7,20,0,0,2413,2414,7,18,0,0,2414,2415,7,8,0,0,
        2415,486,1,0,0,0,2416,2417,7,12,0,0,2417,2418,7,19,0,0,2418,2419,
        7,13,0,0,2419,2420,7,6,0,0,2420,488,1,0,0,0,2421,2422,7,12,0,0,2422,
        2423,7,19,0,0,2423,2424,7,13,0,0,2424,2425,7,6,0,0,2425,2426,7,0,
        0,0,2426,490,1,0,0,0,2427,2428,7,12,0,0,2428,2429,7,19,0,0,2429,
        2430,7,13,0,0,2430,2431,7,13,0,0,2431,2432,7,5,0,0,2432,2433,7,4,
        0,0,2433,2434,7,16,0,0,2434,2435,7,1,0,0,2435,492,1,0,0,0,2436,2437,
        7,12,0,0,2437,2438,7,19,0,0,2438,2439,7,13,0,0,2439,2440,7,13,0,
        0,2440,2441,7,17,0,0,2441,2442,7,3,0,0,2442,494,1,0,0,0,2443,2444,
        7,12,0,0,2444,2445,7,19,0,0,2445,2446,7,21,0,0,2446,496,1,0,0,0,
        2447,2448,7,12,0,0,2448,2449,7,19,0,0,2449,2450,7,21,0,0,2450,2451,
        7,0,0,0,2451,498,1,0,0,0,2452,2453,7,12,0,0,2453,2454,7,17,0,0,2454,
        2455,7,7,0,0,2455,2456,7,7,0,0,2456,2457,7,2,0,0,2457,2458,7,7,0,
        0,2458,2459,7,20,0,0,2459,500,1,0,0,0,2460,2461,7,0,0,0,2461,2462,
        7,16,0,0,2462,2463,7,4,0,0,2463,2464,7,13,0,0,2464,2465,7,4,0,0,
        2465,2466,7,12,0,0,2466,502,1,0,0,0,2467,2468,7,0,0,0,2468,2469,
        7,16,0,0,2469,2470,7,18,0,0,2470,2471,7,6,0,0,2471,2472,7,10,0,0,
        2472,2473,7,4,0,0,2473,504,1,0,0,0,2474,2475,7,0,0,0,2475,2476,7,
        16,0,0,2476,2477,7,18,0,0,2477,2478,7,6,0,0,2478,2479,7,10,0,0,2479,
        2480,7,4,0,0,2480,2481,7,0,0,0,2481,506,1,0,0,0,2482,2483,7,0,0,
        0,2483,2484,7,6,0,0,2484,2485,7,16,0,0,2485,2486,7,19,0,0,2486,2487,
        7,7,0,0,2487,2488,7,9,0,0,2488,508,1,0,0,0,2489,2490,7,0,0,0,2490,
        2491,7,6,0,0,2491,2492,7,16,0,0,2492,2493,7,17,0,0,2493,2494,7,12,
        0,0,2494,2495,7,2,0,0,2495,2496,7,8,0,0,2496,2497,7,14,0,0,2497,
        510,1,0,0,0,2498,2499,7,0,0,0,2499,2500,7,6,0,0,2500,2501,7,6,0,
        0,2501,2502,7,1,0,0,2502,512,1,0,0,0,2503,2504,7,0,0,0,2504,2505,
        7,6,0,0,2505,2506,7,13,0,0,2506,2507,7,6,0,0,2507,2508,7,16,0,0,
        2508,2509,7,8,0,0,2509,514,1,0,0,0,2510,2511,7,0,0,0,2511,2512,7,
        6,0,0,2512,2513,7,12,0,0,2513,2514,7,2,0,0,2514,2515,7,4,0,0,2515,
        2516,7,13,0,0,2516,2517,7,2,0,0,2517,2518,7,15,0,0,2518,2519,7,4,
        0,0,2519,2520,7,5,0,0,2520,2521,7,13,0,0,2521,2522,7,6,0,0,2522,
        516,1,0,0,0,2523,2524,7,0,0,0,2524,2525,7,6,0,0,2525,2526,7,0,0,
        0,2526,2527,7,0,0,0,2527,2528,7,2,0,0,2528,2529,7,19,0,0,2529,2530,
        7,7,0,0,2530,518,1,0,0,0,2531,2532,7,0,0,0,2532,2533,7,6,0,0,2533,
        2534,7,8,0,0,2534,520,1,0,0,0,2535,2536,7,0,0,0,2536,2537,7,6,0,
        0,2537,2538,7,8,0,0,2538,2539,7,0,0,0,2539,522,1,0,0,0,2540,2541,
        7,0,0,0,2541,2542,7,18,0,0,2542,2543,7,19,0,0,2543,2544,7,21,0,0,
        2544,524,1,0,0,0,2545,2546,7,0,0,0,2546,2547,7,19,0,0,2547,2548,
        7,10,0,0,2548,2549,7,6,0,0,2549,526,1,0,0,0,2550,2551,7,0,0,0,2551,
        2552,7,8,0,0,2552,2553,7,4,0,0,2553,2554,7,13,0,0,2554,2555,7,6,
        0,0,2555,528,1,0,0,0,2556,2557,7,0,0,0,2557,2558,7,8,0,0,2558,2559,
        7,4,0,0,2559,2560,7,12,0,0,2560,2561,7,8,0,0,2561,530,1,0,0,0,2562,
        2563,7,0,0,0,2563,2564,7,8,0,0,2564,2565,7,4,0,0,2565,2566,7,8,0,
        0,2566,2567,7,0,0,0,2567,532,1,0,0,0,2568,2569,7,0,0,0,2569,2570,
        7,17,0,0,2570,2571,7,5,0,0,2571,2572,7,0,0,0,2572,2573,7,6,0,0,2573,
        2574,7,8,0,0,2574,534,1,0,0,0,2575,2576,7,0,0,0,2576,2577,7,17,0,
        0,2577,2578,7,5,0,0,2578,2579,7,0,0,0,2579,2580,7,8,0,0,2580,2581,
        7,12,0,0,2581,2582,7,2,0,0,2582,2583,7,7,0,0,2583,2584,7,20,0,0,
        2584,536,1,0,0,0,2585,2586,7,0,0,0,2586,2587,7,14,0,0,2587,2588,
        7,0,0,0,2588,2589,7,8,0,0,2589,2590,7,6,0,0,2590,2591,7,10,0,0,2591,
        538,1,0,0,0,2592,2593,7,8,0,0,2593,2594,7,4,0,0,2594,2595,7,5,0,
        0,2595,2596,7,13,0,0,2596,2597,7,6,0,0,2597,540,1,0,0,0,2598,2599,
        7,8,0,0,2599,2600,7,4,0,0,2600,2601,7,5,0,0,2601,2602,7,13,0,0,2602,
        2603,7,6,0,0,2603,2604,7,0,0,0,2604,542,1,0,0,0,2605,2606,7,8,0,
        0,2606,2607,7,4,0,0,2607,2608,7,5,0,0,2608,2609,7,13,0,0,2609,2610,
        7,6,0,0,2610,2611,7,0,0,0,2611,2612,7,4,0,0,2612,2613,7,10,0,0,2613,
        2614,7,3,0,0,2614,2615,7,13,0,0,2615,2616,7,6,0,0,2616,544,1,0,0,
        0,2617,2618,7,8,0,0,2618,2619,7,6,0,0,2619,2620,7,22,0,0,2620,2621,
        7,8,0,0,2621,546,1,0,0,0,2622,2623,7,0,0,0,2623,2624,7,8,0,0,2624,
        2625,7,12,0,0,2625,2626,7,2,0,0,2626,2627,7,7,0,0,2627,2628,7,20,
        0,0,2628,548,1,0,0,0,2629,2630,7,8,0,0,2630,2631,7,18,0,0,2631,2632,
        7,6,0,0,2632,2633,7,7,0,0,2633,550,1,0,0,0,2634,2635,7,8,0,0,2635,
        2636,7,2,0,0,2636,2637,7,6,0,0,2637,2638,7,0,0,0,2638,552,1,0,0,
        0,2639,2640,7,8,0,0,2640,2641,7,2,0,0,2641,2642,7,10,0,0,2642,2643,
        7,6,0,0,2643,554,1,0,0,0,2644,2645,7,8,0,0,2645,2646,7,2,0,0,2646,
        2647,7,10,0,0,2647,2648,7,6,0,0,2648,2649,7,0,0,0,2649,2650,7,8,
        0,0,2650,2651,7,4,0,0,2651,2652,7,10,0,0,2652,2653,7,3,0,0,2653,
        556,1,0,0,0,2654,2655,7,8,0,0,2655,2656,7,19,0,0,2656,558,1,0,0,
        0,2657,2658,7,8,0,0,2658,2659,7,12,0,0,2659,2660,7,4,0,0,2660,2661,
        7,2,0,0,2661,2662,7,13,0,0,2662,2663,7,2,0,0,2663,2664,7,7,0,0,2664,
        2665,7,20,0,0,2665,560,1,0,0,0,2666,2667,7,8,0,0,2667,2668,7,12,
        0,0,2668,2669,7,4,0,0,2669,2670,7,7,0,0,2670,2671,7,0,0,0,2671,2672,
        7,4,0,0,2672,2673,7,16,0,0,2673,2674,7,8,0,0,2674,2675,7,2,0,0,2675,
        2676,7,19,0,0,2676,2677,7,7,0,0,2677,562,1,0,0,0,2678,2679,7,8,0,
        0,2679,2680,7,12,0,0,2680,2681,7,2,0,0,2681,2682,7,10,0,0,2682,564,
        1,0,0,0,2683,2684,7,8,0,0,2684,2685,7,12,0,0,2685,2686,7,17,0,0,
        2686,2687,7,6,0,0,2687,566,1,0,0,0,2688,2689,7,8,0,0,2689,2690,7,
        12,0,0,2690,2691,7,17,0,0,2691,2692,7,7,0,0,2692,2693,7,16,0,0,2693,
        2694,7,4,0,0,2694,2695,7,8,0,0,2695,2696,7,6,0,0,2696,568,1,0,0,
        0,2697,2698,7,8,0,0,2698,2699,7,12,0,0,2699,2700,7,14,0,0,2700,2701,
        5,95,0,0,2701,2702,7,16,0,0,2702,2703,7,4,0,0,2703,2704,7,0,0,0,
        2704,2705,7,8,0,0,2705,570,1,0,0,0,2706,2707,7,8,0,0,2707,2708,7,
        14,0,0,2708,2709,7,3,0,0,2709,2710,7,6,0,0,2710,572,1,0,0,0,2711,
        2712,7,17,0,0,2712,2713,7,6,0,0,2713,2714,7,0,0,0,2714,2715,7,16,
        0,0,2715,2716,7,4,0,0,2716,2717,7,3,0,0,2717,2718,7,6,0,0,2718,574,
        1,0,0,0,2719,2720,7,17,0,0,2720,2721,7,7,0,0,2721,2722,7,5,0,0,2722,
        2723,7,19,0,0,2723,2724,7,17,0,0,2724,2725,7,7,0,0,2725,2726,7,9,
        0,0,2726,2727,7,6,0,0,2727,2728,7,9,0,0,2728,576,1,0,0,0,2729,2730,
        7,17,0,0,2730,2731,7,7,0,0,2731,2732,7,16,0,0,2732,2733,7,19,0,0,
        2733,2734,7,10,0,0,2734,2735,7,10,0,0,2735,2736,7,2,0,0,2736,2737,
        7,8,0,0,2737,2738,7,8,0,0,2738,2739,7,6,0,0,2739,2740,7,9,0,0,2740,
        578,1,0,0,0,2741,2742,7,17,0,0,2742,2743,7,7,0,0,2743,2744,7,16,
        0,0,2744,2745,7,19,0,0,2745,2746,7,7,0,0,2746,2747,7,9,0,0,2747,
        2748,7,2,0,0,2748,2749,7,8,0,0,2749,2750,7,2,0,0,2750,2751,7,19,
        0,0,2751,2752,7,7,0,0,2752,2753,7,4,0,0,2753,2754,7,13,0,0,2754,
        580,1,0,0,0,2755,2756,7,17,0,0,2756,2757,7,7,0,0,2757,2758,7,2,0,
        0,2758,2759,7,19,0,0,2759,2760,7,7,0,0,2760,582,1,0,0,0,2761,2762,
        7,17,0,0,2762,2763,7,7,0,0,2763,2764,7,2,0,0,2764,2765,7,25,0,0,
        2765,2766,7,17,0,0,2766,2767,7,6,0,0,2767,584,1,0,0,0,2768,2769,
        7,17,0,0,2769,2770,7,7,0,0,2770,2771,7,1,0,0,2771,2772,7,7,0,0,2772,
        2773,7,19,0,0,2773,2774,7,21,0,0,2774,2775,7,7,0,0,2775,586,1,0,
        0,0,2776,2777,7,17,0,0,2777,2778,7,7,0,0,2778,2779,7,10,0,0,2779,
        2780,7,4,0,0,2780,2781,7,8,0,0,2781,2782,7,16,0,0,2782,2783,7,18,
        0,0,2783,2784,7,6,0,0,2784,2785,7,9,0,0,2785,588,1,0,0,0,2786,2787,
        7,17,0,0,2787,2788,7,7,0,0,2788,2789,7,7,0,0,2789,2790,7,6,0,0,2790,
        2791,7,0,0,0,2791,2792,7,8,0,0,2792,590,1,0,0,0,2793,2794,7,17,0,
        0,2794,2795,7,7,0,0,2795,2796,7,8,0,0,2796,2797,7,2,0,0,2797,2798,
        7,13,0,0,2798,592,1,0,0,0,2799,2800,7,17,0,0,2800,2801,7,3,0,0,2801,
        2802,7,9,0,0,2802,2803,7,4,0,0,2803,2804,7,8,0,0,2804,2805,7,6,0,
        0,2805,594,1,0,0,0,2806,2807,7,17,0,0,2807,2808,7,0,0,0,2808,2809,
        7,6,0,0,2809,596,1,0,0,0,2810,2811,7,17,0,0,2811,2812,7,0,0,0,2812,
        2813,7,6,0,0,2813,2814,7,12,0,0,2814,598,1,0,0,0,2815,2816,7,17,
        0,0,2816,2817,7,0,0,0,2817,2818,7,2,0,0,2818,2819,7,7,0,0,2819,2820,
        7,20,0,0,2820,600,1,0,0,0,2821,2822,7,17,0,0,2822,2823,7,8,0,0,2823,
        2824,7,11,0,0,2824,2825,5,49,0,0,2825,2826,5,54,0,0,2826,602,1,0,
        0,0,2827,2828,7,17,0,0,2828,2829,7,8,0,0,2829,2830,7,11,0,0,2830,
        2831,5,51,0,0,2831,2832,5,50,0,0,2832,604,1,0,0,0,2833,2834,7,17,
        0,0,2834,2835,7,8,0,0,2835,2836,7,11,0,0,2836,2837,5,56,0,0,2837,
        606,1,0,0,0,2838,2839,7,23,0,0,2839,2840,7,4,0,0,2840,2841,7,13,
        0,0,2841,2842,7,2,0,0,2842,2843,7,9,0,0,2843,2844,7,4,0,0,2844,2845,
        7,8,0,0,2845,2846,7,6,0,0,2846,608,1,0,0,0,2847,2848,7,23,0,0,2848,
        2849,7,4,0,0,2849,2850,7,13,0,0,2850,2851,7,17,0,0,2851,2852,7,6,
        0,0,2852,610,1,0,0,0,2853,2854,7,23,0,0,2854,2855,7,4,0,0,2855,2856,
        7,13,0,0,2856,2857,7,17,0,0,2857,2858,7,6,0,0,2858,2859,7,0,0,0,
        2859,612,1,0,0,0,2860,2861,7,23,0,0,2861,2862,7,6,0,0,2862,2863,
        7,12,0,0,2863,2864,7,5,0,0,2864,2865,7,19,0,0,2865,2866,7,0,0,0,
        2866,2867,7,6,0,0,2867,614,1,0,0,0,2868,2869,7,23,0,0,2869,2870,
        7,6,0,0,2870,2871,7,12,0,0,2871,2872,7,0,0,0,2872,2873,7,2,0,0,2873,
        2874,7,19,0,0,2874,2875,7,7,0,0,2875,616,1,0,0,0,2876,2877,7,23,
        0,0,2877,2878,7,2,0,0,2878,2879,7,6,0,0,2879,2880,7,21,0,0,2880,
        618,1,0,0,0,2881,2882,7,21,0,0,2882,2883,7,18,0,0,2883,2884,7,6,
        0,0,2884,2885,7,7,0,0,2885,620,1,0,0,0,2886,2887,7,21,0,0,2887,2888,
        7,18,0,0,2888,2889,7,6,0,0,2889,2890,7,12,0,0,2890,2891,7,6,0,0,
        2891,622,1,0,0,0,2892,2893,7,21,0,0,2893,2894,7,18,0,0,2894,2895,
        7,2,0,0,2895,2896,7,13,0,0,2896,2897,7,6,0,0,2897,624,1,0,0,0,2898,
        2899,7,21,0,0,2899,2900,7,2,0,0,2900,2901,7,7,0,0,2901,2902,7,9,
        0,0,2902,2903,7,19,0,0,2903,2904,7,21,0,0,2904,626,1,0,0,0,2905,
        2906,7,21,0,0,2906,2907,7,2,0,0,2907,2908,7,8,0,0,2908,2909,7,18,
        0,0,2909,628,1,0,0,0,2910,2911,7,21,0,0,2911,2912,7,2,0,0,2912,2913,
        7,8,0,0,2913,2914,7,18,0,0,2914,2915,7,2,0,0,2915,2916,7,7,0,0,2916,
        630,1,0,0,0,2917,2918,7,21,0,0,2918,2919,7,2,0,0,2919,2920,7,8,0,
        0,2920,2921,7,18,0,0,2921,2922,7,19,0,0,2922,2923,7,17,0,0,2923,
        2924,7,8,0,0,2924,632,1,0,0,0,2925,2926,7,21,0,0,2926,2927,7,19,
        0,0,2927,2928,7,12,0,0,2928,2929,7,1,0,0,2929,634,1,0,0,0,2930,2931,
        7,21,0,0,2931,2932,7,12,0,0,2932,2933,7,4,0,0,2933,2934,7,3,0,0,
        2934,2935,7,3,0,0,2935,2936,7,6,0,0,2936,2937,7,12,0,0,2937,636,
        1,0,0,0,2938,2939,7,21,0,0,2939,2940,7,12,0,0,2940,2941,7,2,0,0,
        2941,2942,7,8,0,0,2942,2943,7,6,0,0,2943,638,1,0,0,0,2944,2945,7,
        14,0,0,2945,2946,7,6,0,0,2946,2947,7,4,0,0,2947,2948,7,12,0,0,2948,
        640,1,0,0,0,2949,2950,7,15,0,0,2950,2951,7,19,0,0,2951,2952,7,7,
        0,0,2952,2953,7,6,0,0,2953,642,1,0,0,0,2954,2955,5,61,0,0,2955,644,
        1,0,0,0,2956,2957,5,60,0,0,2957,2961,5,62,0,0,2958,2959,5,33,0,0,
        2959,2961,5,61,0,0,2960,2956,1,0,0,0,2960,2958,1,0,0,0,2961,646,
        1,0,0,0,2962,2963,5,60,0,0,2963,648,1,0,0,0,2964,2965,5,60,0,0,2965,
        2966,5,61,0,0,2966,650,1,0,0,0,2967,2968,5,62,0,0,2968,652,1,0,0,
        0,2969,2970,5,62,0,0,2970,2971,5,61,0,0,2971,654,1,0,0,0,2972,2973,
        5,43,0,0,2973,656,1,0,0,0,2974,2975,5,45,0,0,2975,658,1,0,0,0,2976,
        2977,5,42,0,0,2977,660,1,0,0,0,2978,2979,5,47,0,0,2979,662,1,0,0,
        0,2980,2981,5,37,0,0,2981,664,1,0,0,0,2982,2983,5,124,0,0,2983,2984,
        5,124,0,0,2984,666,1,0,0,0,2985,2986,5,63,0,0,2986,668,1,0,0,0,2987,
        2988,5,59,0,0,2988,670,1,0,0,0,2989,2995,5,39,0,0,2990,2994,8,26,
        0,0,2991,2992,5,39,0,0,2992,2994,5,39,0,0,2993,2990,1,0,0,0,2993,
        2991,1,0,0,0,2994,2997,1,0,0,0,2995,2993,1,0,0,0,2995,2996,1,0,0,
        0,2996,2998,1,0,0,0,2997,2995,1,0,0,0,2998,2999,5,39,0,0,2999,672,
        1,0,0,0,3000,3001,7,17,0,0,3001,3002,5,38,0,0,3002,3003,5,39,0,0,
        3003,3009,1,0,0,0,3004,3008,8,26,0,0,3005,3006,5,39,0,0,3006,3008,
        5,39,0,0,3007,3004,1,0,0,0,3007,3005,1,0,0,0,3008,3011,1,0,0,0,3009,
        3007,1,0,0,0,3009,3010,1,0,0,0,3010,3012,1,0,0,0,3011,3009,1,0,0,
        0,3012,3013,5,39,0,0,3013,674,1,0,0,0,3014,3015,5,36,0,0,3015,3016,
        5,36,0,0,3016,3020,1,0,0,0,3017,3019,9,0,0,0,3018,3017,1,0,0,0,3019,
        3022,1,0,0,0,3020,3021,1,0,0,0,3020,3018,1,0,0,0,3021,3023,1,0,0,
        0,3022,3020,1,0,0,0,3023,3024,5,36,0,0,3024,3025,5,36,0,0,3025,676,
        1,0,0,0,3026,3027,7,22,0,0,3027,3028,5,39,0,0,3028,3032,1,0,0,0,
        3029,3031,8,26,0,0,3030,3029,1,0,0,0,3031,3034,1,0,0,0,3032,3030,
        1,0,0,0,3032,3033,1,0,0,0,3033,3035,1,0,0,0,3034,3032,1,0,0,0,3035,
        3036,5,39,0,0,3036,678,1,0,0,0,3037,3042,3,693,346,0,3038,3042,3,
        695,347,0,3039,3042,3,697,348,0,3040,3042,3,699,349,0,3041,3037,
        1,0,0,0,3041,3038,1,0,0,0,3041,3039,1,0,0,0,3041,3040,1,0,0,0,3042,
        680,1,0,0,0,3043,3044,3,693,346,0,3044,3046,5,46,0,0,3045,3047,3,
        693,346,0,3046,3045,1,0,0,0,3046,3047,1,0,0,0,3047,3051,1,0,0,0,
        3048,3049,5,46,0,0,3049,3051,3,693,346,0,3050,3043,1,0,0,0,3050,
        3048,1,0,0,0,3051,682,1,0,0,0,3052,3054,3,703,351,0,3053,3052,1,
        0,0,0,3054,3055,1,0,0,0,3055,3053,1,0,0,0,3055,3056,1,0,0,0,3056,
        3064,1,0,0,0,3057,3061,5,46,0,0,3058,3060,3,703,351,0,3059,3058,
        1,0,0,0,3060,3063,1,0,0,0,3061,3059,1,0,0,0,3061,3062,1,0,0,0,3062,
        3065,1,0,0,0,3063,3061,1,0,0,0,3064,3057,1,0,0,0,3064,3065,1,0,0,
        0,3065,3066,1,0,0,0,3066,3067,3,701,350,0,3067,3077,1,0,0,0,3068,
        3070,5,46,0,0,3069,3071,3,703,351,0,3070,3069,1,0,0,0,3071,3072,
        1,0,0,0,3072,3070,1,0,0,0,3072,3073,1,0,0,0,3073,3074,1,0,0,0,3074,
        3075,3,701,350,0,3075,3077,1,0,0,0,3076,3053,1,0,0,0,3076,3068,1,
        0,0,0,3077,684,1,0,0,0,3078,3081,3,705,352,0,3079,3081,5,95,0,0,
        3080,3078,1,0,0,0,3080,3079,1,0,0,0,3081,3087,1,0,0,0,3082,3086,
        3,705,352,0,3083,3086,3,703,351,0,3084,3086,5,95,0,0,3085,3082,1,
        0,0,0,3085,3083,1,0,0,0,3085,3084,1,0,0,0,3086,3089,1,0,0,0,3087,
        3085,1,0,0,0,3087,3088,1,0,0,0,3088,686,1,0,0,0,3089,3087,1,0,0,
        0,3090,3094,3,703,351,0,3091,3095,3,705,352,0,3092,3095,3,703,351,
        0,3093,3095,5,95,0,0,3094,3091,1,0,0,0,3094,3092,1,0,0,0,3094,3093,
        1,0,0,0,3095,3096,1,0,0,0,3096,3094,1,0,0,0,3096,3097,1,0,0,0,3097,
        688,1,0,0,0,3098,3104,5,34,0,0,3099,3103,8,27,0,0,3100,3101,5,34,
        0,0,3101,3103,5,34,0,0,3102,3099,1,0,0,0,3102,3100,1,0,0,0,3103,
        3106,1,0,0,0,3104,3102,1,0,0,0,3104,3105,1,0,0,0,3105,3107,1,0,0,
        0,3106,3104,1,0,0,0,3107,3108,5,34,0,0,3108,690,1,0,0,0,3109,3115,
        5,96,0,0,3110,3114,8,28,0,0,3111,3112,5,96,0,0,3112,3114,5,96,0,
        0,3113,3110,1,0,0,0,3113,3111,1,0,0,0,3114,3117,1,0,0,0,3115,3113,
        1,0,0,0,3115,3116,1,0,0,0,3116,3118,1,0,0,0,3117,3115,1,0,0,0,3118,
        3119,5,96,0,0,3119,692,1,0,0,0,3120,3127,3,703,351,0,3121,3123,5,
        95,0,0,3122,3121,1,0,0,0,3122,3123,1,0,0,0,3123,3124,1,0,0,0,3124,
        3126,3,703,351,0,3125,3122,1,0,0,0,3126,3129,1,0,0,0,3127,3125,1,
        0,0,0,3127,3128,1,0,0,0,3128,694,1,0,0,0,3129,3127,1,0,0,0,3130,
        3131,5,48,0,0,3131,3132,7,22,0,0,3132,3140,1,0,0,0,3133,3135,5,95,
        0,0,3134,3133,1,0,0,0,3134,3135,1,0,0,0,3135,3138,1,0,0,0,3136,3139,
        3,703,351,0,3137,3139,7,29,0,0,3138,3136,1,0,0,0,3138,3137,1,0,0,
        0,3139,3141,1,0,0,0,3140,3134,1,0,0,0,3141,3142,1,0,0,0,3142,3140,
        1,0,0,0,3142,3143,1,0,0,0,3143,696,1,0,0,0,3144,3145,5,48,0,0,3145,
        3146,7,19,0,0,3146,3151,1,0,0,0,3147,3149,5,95,0,0,3148,3147,1,0,
        0,0,3148,3149,1,0,0,0,3149,3150,1,0,0,0,3150,3152,7,30,0,0,3151,
        3148,1,0,0,0,3152,3153,1,0,0,0,3153,3151,1,0,0,0,3153,3154,1,0,0,
        0,3154,698,1,0,0,0,3155,3156,5,48,0,0,3156,3157,7,5,0,0,3157,3162,
        1,0,0,0,3158,3160,5,95,0,0,3159,3158,1,0,0,0,3159,3160,1,0,0,0,3160,
        3161,1,0,0,0,3161,3163,7,31,0,0,3162,3159,1,0,0,0,3163,3164,1,0,
        0,0,3164,3162,1,0,0,0,3164,3165,1,0,0,0,3165,700,1,0,0,0,3166,3168,
        7,6,0,0,3167,3169,7,32,0,0,3168,3167,1,0,0,0,3168,3169,1,0,0,0,3169,
        3171,1,0,0,0,3170,3172,3,703,351,0,3171,3170,1,0,0,0,3172,3173,1,
        0,0,0,3173,3171,1,0,0,0,3173,3174,1,0,0,0,3174,702,1,0,0,0,3175,
        3176,7,33,0,0,3176,704,1,0,0,0,3177,3178,7,34,0,0,3178,706,1,0,0,
        0,3179,3180,5,45,0,0,3180,3181,5,45,0,0,3181,3185,1,0,0,0,3182,3184,
        8,35,0,0,3183,3182,1,0,0,0,3184,3187,1,0,0,0,3185,3183,1,0,0,0,3185,
        3186,1,0,0,0,3186,3189,1,0,0,0,3187,3185,1,0,0,0,3188,3190,5,13,
        0,0,3189,3188,1,0,0,0,3189,3190,1,0,0,0,3190,3192,1,0,0,0,3191,3193,
        5,10,0,0,3192,3191,1,0,0,0,3192,3193,1,0,0,0,3193,3194,1,0,0,0,3194,
        3195,6,353,0,0,3195,708,1,0,0,0,3196,3197,5,47,0,0,3197,3198,5,42,
        0,0,3198,3202,1,0,0,0,3199,3201,9,0,0,0,3200,3199,1,0,0,0,3201,3204,
        1,0,0,0,3202,3203,1,0,0,0,3202,3200,1,0,0,0,3203,3205,1,0,0,0,3204,
        3202,1,0,0,0,3205,3206,5,42,0,0,3206,3207,5,47,0,0,3207,3208,1,0,
        0,0,3208,3209,6,354,0,0,3209,710,1,0,0,0,3210,3212,7,36,0,0,3211,
        3210,1,0,0,0,3212,3213,1,0,0,0,3213,3211,1,0,0,0,3213,3214,1,0,0,
        0,3214,3215,1,0,0,0,3215,3216,6,355,0,0,3216,712,1,0,0,0,3217,3218,
        9,0,0,0,3218,714,1,0,0,0,41,0,2960,2993,2995,3007,3009,3020,3032,
        3041,3046,3050,3055,3061,3064,3072,3076,3080,3085,3087,3094,3096,
        3102,3104,3113,3115,3122,3127,3134,3138,3142,3148,3153,3159,3164,
        3168,3173,3185,3189,3192,3202,3213,1,0,1,0
    ];

    private static __ATN: antlr.ATN;
    public static get _ATN(): antlr.ATN {
        if (!SqlBaseLexer.__ATN) {
            SqlBaseLexer.__ATN = new antlr.ATNDeserializer().deserialize(SqlBaseLexer._serializedATN);
        }

        return SqlBaseLexer.__ATN;
    }


    private static readonly vocabulary = new antlr.Vocabulary(SqlBaseLexer.literalNames, SqlBaseLexer.symbolicNames, []);

    public override get vocabulary(): antlr.Vocabulary {
        return SqlBaseLexer.vocabulary;
    }

    private static readonly decisionsToDFA = SqlBaseLexer._ATN.decisionToState.map( (ds: antlr.DecisionState, index: number) => new antlr.DFA(ds, index) );
}