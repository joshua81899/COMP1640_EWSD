PGDMP  '    	                }            university_magazine    17.4    17.4 �    �           0    0    ENCODING    ENCODING        SET client_encoding = 'UTF8';
                           false            �           0    0 
   STDSTRINGS 
   STDSTRINGS     (   SET standard_conforming_strings = 'on';
                           false            �           0    0 
   SEARCHPATH 
   SEARCHPATH     8   SELECT pg_catalog.set_config('search_path', '', false);
                           false            �           1262    16384    university_magazine    DATABASE     �   CREATE DATABASE university_magazine WITH TEMPLATE = template0 ENCODING = 'UTF8' LOCALE_PROVIDER = libc LOCALE = 'English_United States.1252';
 #   DROP DATABASE university_magazine;
                     postgres    false            {           1247    16428    submission_status    TYPE     �   CREATE TYPE public.submission_status AS ENUM (
    'pending',
    'under_review',
    'commented',
    'selected',
    'rejected',
    'Submitted',
    'Selected',
    'Rejected'
);
 $   DROP TYPE public.submission_status;
       public               postgres    false            �            1255    24715    current_user_faculty_id()    FUNCTION     �   CREATE FUNCTION public.current_user_faculty_id() RETURNS character varying
    LANGUAGE plpgsql
    AS $$
BEGIN
    -- This is a placeholder function
    RETURN (SELECT faculty_id FROM faculties LIMIT 1);
END;
$$;
 0   DROP FUNCTION public.current_user_faculty_id();
       public               postgres    false            �            1255    24714    current_user_id()    FUNCTION     �   CREATE FUNCTION public.current_user_id() RETURNS integer
    LANGUAGE plpgsql
    AS $$
BEGIN
    -- This is a placeholder function
    RETURN (SELECT user_id FROM users LIMIT 1);
END;
$$;
 (   DROP FUNCTION public.current_user_id();
       public               postgres    false            �            1255    16541     log_page_view(character varying)    FUNCTION     |  CREATE FUNCTION public.log_page_view(page_name character varying) RETURNS void
    LANGUAGE plpgsql
    AS $$
BEGIN
    INSERT INTO PageStatistics (page_name, view_count, last_viewed) 
    VALUES (page_name, 1, CURRENT_TIMESTAMP)
    ON CONFLICT (page_name) 
    DO UPDATE SET 
        view_count = PageStatistics.view_count + 1,
        last_viewed = CURRENT_TIMESTAMP;
END;
$$;
 A   DROP FUNCTION public.log_page_view(page_name character varying);
       public               postgres    false            �            1255    16542 9   record_browser_info(character varying, character varying)    FUNCTION     �  CREATE FUNCTION public.record_browser_info(browser character varying, version character varying) RETURNS void
    LANGUAGE plpgsql
    AS $$
BEGIN
    INSERT INTO UserBrowserStats (browser_name, browser_version, user_count, last_updated)
    VALUES (browser, version, 1, CURRENT_TIMESTAMP)
    ON CONFLICT (browser_name, browser_version)
    DO UPDATE SET
        user_count = UserBrowserStats.user_count + 1,
        last_updated = CURRENT_TIMESTAMP;
END;
$$;
 `   DROP FUNCTION public.record_browser_info(browser character varying, version character varying);
       public               postgres    false            �            1255    16543 $   update_last_login(character varying)    FUNCTION     �   CREATE FUNCTION public.update_last_login(user_email character varying) RETURNS void
    LANGUAGE plpgsql
    AS $$
BEGIN
    UPDATE Users
    SET last_login = CURRENT_TIMESTAMP
    WHERE email = user_email;
END;
$$;
 F   DROP FUNCTION public.update_last_login(user_email character varying);
       public               postgres    false            �            1255    16539    update_last_modified()    FUNCTION     �   CREATE FUNCTION public.update_last_modified() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    NEW.last_updated = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$;
 -   DROP FUNCTION public.update_last_modified();
       public               postgres    false            �            1259    24589    academic_settings    TABLE     �   CREATE TABLE public.academic_settings (
    setting_id integer NOT NULL,
    academic_year character varying(10) NOT NULL,
    submission_deadline date NOT NULL,
    final_edit_deadline date NOT NULL
);
 %   DROP TABLE public.academic_settings;
       public         heap r       postgres    false            �            1259    24588     academic_settings_setting_id_seq    SEQUENCE     �   CREATE SEQUENCE public.academic_settings_setting_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
 7   DROP SEQUENCE public.academic_settings_setting_id_seq;
       public               postgres    false    237            �           0    0     academic_settings_setting_id_seq    SEQUENCE OWNED BY     e   ALTER SEQUENCE public.academic_settings_setting_id_seq OWNED BY public.academic_settings.setting_id;
          public               postgres    false    236            �            1259    16504    academicsettings    TABLE     �  CREATE TABLE public.academicsettings (
    setting_id integer NOT NULL,
    academic_year character varying(10) NOT NULL,
    submission_deadline date NOT NULL,
    final_edit_deadline date NOT NULL,
    created_by integer,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);
 $   DROP TABLE public.academicsettings;
       public         heap r       postgres    false            �           0    0    TABLE academicsettings    ACL     �   GRANT ALL ON TABLE public.academicsettings TO admin;
GRANT SELECT ON TABLE public.academicsettings TO marketing_manager;
GRANT SELECT ON TABLE public.academicsettings TO student;
          public               postgres    false    229            �            1259    16503    academicsettings_setting_id_seq    SEQUENCE     �   CREATE SEQUENCE public.academicsettings_setting_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
 6   DROP SEQUENCE public.academicsettings_setting_id_seq;
       public               postgres    false    229            �           0    0    academicsettings_setting_id_seq    SEQUENCE OWNED BY     c   ALTER SEQUENCE public.academicsettings_setting_id_seq OWNED BY public.academicsettings.setting_id;
          public               postgres    false    228            �           0    0 (   SEQUENCE academicsettings_setting_id_seq    ACL     �   GRANT ALL ON SEQUENCE public.academicsettings_setting_id_seq TO admin;
GRANT USAGE ON SEQUENCE public.academicsettings_setting_id_seq TO faculty_coordinator;
          public               postgres    false    228            �            1259    16489    activitylogs    TABLE     [  CREATE TABLE public.activitylogs (
    log_id integer NOT NULL,
    user_id integer NOT NULL,
    action_type character varying(50) NOT NULL,
    page_accessed character varying(100),
    browser_info character varying(255),
    ip_address character varying(45),
    log_timestamp timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);
     DROP TABLE public.activitylogs;
       public         heap r       postgres    false            �           0    0    TABLE activitylogs    ACL     �   GRANT ALL ON TABLE public.activitylogs TO admin;
GRANT SELECT,INSERT,UPDATE ON TABLE public.activitylogs TO faculty_coordinator;
GRANT SELECT ON TABLE public.activitylogs TO marketing_manager;
          public               postgres    false    227            �            1259    16488    activitylogs_log_id_seq    SEQUENCE     �   CREATE SEQUENCE public.activitylogs_log_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
 .   DROP SEQUENCE public.activitylogs_log_id_seq;
       public               postgres    false    227            �           0    0    activitylogs_log_id_seq    SEQUENCE OWNED BY     S   ALTER SEQUENCE public.activitylogs_log_id_seq OWNED BY public.activitylogs.log_id;
          public               postgres    false    226            �           0    0     SEQUENCE activitylogs_log_id_seq    ACL     �   GRANT ALL ON SEQUENCE public.activitylogs_log_id_seq TO admin;
GRANT USAGE ON SEQUENCE public.activitylogs_log_id_seq TO faculty_coordinator;
          public               postgres    false    226            �            1259    24596 
   admissions    TABLE     �   CREATE TABLE public.admissions (
    admission_id integer NOT NULL,
    user_id integer NOT NULL,
    admission_status character varying NOT NULL,
    admission_date date NOT NULL
);
    DROP TABLE public.admissions;
       public         heap r       postgres    false            �            1259    24595    admissions_admission_id_seq    SEQUENCE     �   CREATE SEQUENCE public.admissions_admission_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
 2   DROP SEQUENCE public.admissions_admission_id_seq;
       public               postgres    false    239            �           0    0    admissions_admission_id_seq    SEQUENCE OWNED BY     [   ALTER SEQUENCE public.admissions_admission_id_seq OWNED BY public.admissions.admission_id;
          public               postgres    false    238            �            1259    16467    comments    TABLE     !  CREATE TABLE public.comments (
    comment_id integer NOT NULL,
    submission_id integer NOT NULL,
    user_id integer NOT NULL,
    comment_text text NOT NULL,
    commented_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    is_read boolean DEFAULT false NOT NULL
);
    DROP TABLE public.comments;
       public         heap r       postgres    false            �           0    0    TABLE comments    ACL       GRANT ALL ON TABLE public.comments TO admin;
GRANT SELECT,INSERT,UPDATE ON TABLE public.comments TO faculty_coordinator;
GRANT SELECT,INSERT,UPDATE ON TABLE public.comments TO marketing_manager;
GRANT SELECT,INSERT,UPDATE ON TABLE public.comments TO student;
          public               postgres    false    225            �            1259    16466    comments_comment_id_seq    SEQUENCE     �   CREATE SEQUENCE public.comments_comment_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
 .   DROP SEQUENCE public.comments_comment_id_seq;
       public               postgres    false    225            �           0    0    comments_comment_id_seq    SEQUENCE OWNED BY     S   ALTER SEQUENCE public.comments_comment_id_seq OWNED BY public.comments.comment_id;
          public               postgres    false    224            �           0    0     SEQUENCE comments_comment_id_seq    ACL     �   GRANT ALL ON SEQUENCE public.comments_comment_id_seq TO admin;
GRANT USAGE ON SEQUENCE public.comments_comment_id_seq TO faculty_coordinator;
GRANT USAGE ON SEQUENCE public.comments_comment_id_seq TO student;
          public               postgres    false    224            �            1259    16386 	   faculties    TABLE     �   CREATE TABLE public.faculties (
    faculty_id character varying(10) NOT NULL,
    faculty_name character varying(100) NOT NULL,
    description text
);
    DROP TABLE public.faculties;
       public         heap r       postgres    false            �           0    0    TABLE faculties    ACL     �   GRANT ALL ON TABLE public.faculties TO admin;
GRANT SELECT ON TABLE public.faculties TO marketing_manager;
GRANT SELECT ON TABLE public.faculties TO student;
          public               postgres    false    218            �            1259    24659    faculties_backup    TABLE     �   CREATE TABLE public.faculties_backup (
    faculty_id character varying(10),
    faculty_name character varying(100),
    description text
);
 $   DROP TABLE public.faculties_backup;
       public         heap r       postgres    false            �            1259    16385    faculties_faculty_id_seq    SEQUENCE     �   CREATE SEQUENCE public.faculties_faculty_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
 /   DROP SEQUENCE public.faculties_faculty_id_seq;
       public               postgres    false    218            �           0    0    faculties_faculty_id_seq    SEQUENCE OWNED BY     U   ALTER SEQUENCE public.faculties_faculty_id_seq OWNED BY public.faculties.faculty_id;
          public               postgres    false    217            �           0    0 !   SEQUENCE faculties_faculty_id_seq    ACL     �   GRANT ALL ON SEQUENCE public.faculties_faculty_id_seq TO admin;
GRANT USAGE ON SEQUENCE public.faculties_faculty_id_seq TO faculty_coordinator;
          public               postgres    false    217            �            1259    24664    faculty_id_mapping    TABLE     a   CREATE TABLE public.faculty_id_mapping (
    old_id integer,
    new_id character varying(10)
);
 &   DROP TABLE public.faculty_id_mapping;
       public         heap r       postgres    false            �            1259    24577    logs    TABLE     �   CREATE TABLE public.logs (
    log_id integer NOT NULL,
    user_id integer NOT NULL,
    action_type character varying(50) NOT NULL,
    log_timestamp timestamp without time zone NOT NULL
);
    DROP TABLE public.logs;
       public         heap r       postgres    false            �            1259    24576    logs_log_id_seq    SEQUENCE     �   CREATE SEQUENCE public.logs_log_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
 &   DROP SEQUENCE public.logs_log_id_seq;
       public               postgres    false    235            �           0    0    logs_log_id_seq    SEQUENCE OWNED BY     C   ALTER SEQUENCE public.logs_log_id_seq OWNED BY public.logs.log_id;
          public               postgres    false    234            �            1259    24610    page_visits    TABLE     5  CREATE TABLE public.page_visits (
    visit_id integer NOT NULL,
    user_id integer,
    page_url character varying(255) NOT NULL,
    visit_timestamp timestamp without time zone DEFAULT now() NOT NULL,
    browser_info character varying(255),
    ip_address character varying(45),
    time_spent integer
);
    DROP TABLE public.page_visits;
       public         heap r       postgres    false            �            1259    24609    page_visits_visit_id_seq    SEQUENCE     �   CREATE SEQUENCE public.page_visits_visit_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
 /   DROP SEQUENCE public.page_visits_visit_id_seq;
       public               postgres    false    241            �           0    0    page_visits_visit_id_seq    SEQUENCE OWNED BY     U   ALTER SEQUENCE public.page_visits_visit_id_seq OWNED BY public.page_visits.visit_id;
          public               postgres    false    240            �            1259    16518    pagestatistics    TABLE     �   CREATE TABLE public.pagestatistics (
    stat_id integer NOT NULL,
    page_name character varying(100) NOT NULL,
    view_count integer DEFAULT 0 NOT NULL,
    last_viewed timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);
 "   DROP TABLE public.pagestatistics;
       public         heap r       postgres    false            �           0    0    TABLE pagestatistics    ACL     u   GRANT ALL ON TABLE public.pagestatistics TO admin;
GRANT SELECT ON TABLE public.pagestatistics TO marketing_manager;
          public               postgres    false    231            �            1259    16517    pagestatistics_stat_id_seq    SEQUENCE     �   CREATE SEQUENCE public.pagestatistics_stat_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
 1   DROP SEQUENCE public.pagestatistics_stat_id_seq;
       public               postgres    false    231            �           0    0    pagestatistics_stat_id_seq    SEQUENCE OWNED BY     Y   ALTER SEQUENCE public.pagestatistics_stat_id_seq OWNED BY public.pagestatistics.stat_id;
          public               postgres    false    230            �           0    0 #   SEQUENCE pagestatistics_stat_id_seq    ACL     �   GRANT ALL ON SEQUENCE public.pagestatistics_stat_id_seq TO admin;
GRANT USAGE ON SEQUENCE public.pagestatistics_stat_id_seq TO faculty_coordinator;
          public               postgres    false    230            �            1259    16395    roles    TABLE     �   CREATE TABLE public.roles (
    role_name character varying(50) NOT NULL,
    description text NOT NULL,
    role_id character varying(10) NOT NULL
);
    DROP TABLE public.roles;
       public         heap r       postgres    false            �           0    0    TABLE roles    ACL     c   GRANT ALL ON TABLE public.roles TO admin;
GRANT SELECT ON TABLE public.roles TO marketing_manager;
          public               postgres    false    219            �            1259    24761    roles_backup    TABLE     u   CREATE TABLE public.roles_backup (
    role_id integer,
    role_name character varying(50),
    description text
);
     DROP TABLE public.roles_backup;
       public         heap r       postgres    false            �            1259    16440    submissions    TABLE     �  CREATE TABLE public.submissions (
    submission_id integer NOT NULL,
    user_id integer NOT NULL,
    faculty_id character varying(10) NOT NULL,
    title character varying(200) NOT NULL,
    description text,
    file_path character varying(255) NOT NULL,
    file_type character varying(50) NOT NULL,
    submitted_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    last_updated timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    status public.submission_status DEFAULT 'Submitted'::public.submission_status NOT NULL,
    terms_accepted boolean DEFAULT false NOT NULL,
    academic_year character varying(10) NOT NULL,
    selected boolean DEFAULT false NOT NULL
);
    DROP TABLE public.submissions;
       public         heap r       postgres    false    891    891            �           0    0    TABLE submissions    ACL     4  GRANT ALL ON TABLE public.submissions TO admin;
GRANT SELECT,INSERT,UPDATE ON TABLE public.submissions TO faculty_coordinator;
GRANT SELECT ON TABLE public.submissions TO marketing_manager;
GRANT SELECT,INSERT,UPDATE ON TABLE public.submissions TO student;
GRANT SELECT ON TABLE public.submissions TO guest;
          public               postgres    false    223            �            1259    16439    submissions_submission_id_seq    SEQUENCE     �   CREATE SEQUENCE public.submissions_submission_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
 4   DROP SEQUENCE public.submissions_submission_id_seq;
       public               postgres    false    223            �           0    0    submissions_submission_id_seq    SEQUENCE OWNED BY     _   ALTER SEQUENCE public.submissions_submission_id_seq OWNED BY public.submissions.submission_id;
          public               postgres    false    222                        0    0 &   SEQUENCE submissions_submission_id_seq    ACL     �   GRANT ALL ON SEQUENCE public.submissions_submission_id_seq TO admin;
GRANT USAGE ON SEQUENCE public.submissions_submission_id_seq TO faculty_coordinator;
GRANT USAGE ON SEQUENCE public.submissions_submission_id_seq TO student;
          public               postgres    false    222            �            1259    16529    userbrowserstats    TABLE       CREATE TABLE public.userbrowserstats (
    stat_id integer NOT NULL,
    browser_name character varying(50) NOT NULL,
    browser_version character varying(50),
    user_count integer DEFAULT 0 NOT NULL,
    last_updated timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);
 $   DROP TABLE public.userbrowserstats;
       public         heap r       postgres    false                       0    0    TABLE userbrowserstats    ACL     y   GRANT ALL ON TABLE public.userbrowserstats TO admin;
GRANT SELECT ON TABLE public.userbrowserstats TO marketing_manager;
          public               postgres    false    233            �            1259    16528    userbrowserstats_stat_id_seq    SEQUENCE     �   CREATE SEQUENCE public.userbrowserstats_stat_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
 3   DROP SEQUENCE public.userbrowserstats_stat_id_seq;
       public               postgres    false    233                       0    0    userbrowserstats_stat_id_seq    SEQUENCE OWNED BY     ]   ALTER SEQUENCE public.userbrowserstats_stat_id_seq OWNED BY public.userbrowserstats.stat_id;
          public               postgres    false    232                       0    0 %   SEQUENCE userbrowserstats_stat_id_seq    ACL     �   GRANT ALL ON SEQUENCE public.userbrowserstats_stat_id_seq TO admin;
GRANT USAGE ON SEQUENCE public.userbrowserstats_stat_id_seq TO faculty_coordinator;
          public               postgres    false    232            �            1259    16404    users    TABLE     /  CREATE TABLE public.users (
    user_id integer NOT NULL,
    first_name character varying(50) NOT NULL,
    last_name character varying(50) NOT NULL,
    email character varying(100) NOT NULL,
    password character varying(255) NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    last_login timestamp without time zone,
    faculty_id character varying(10),
    role_id character varying(10) NOT NULL,
    CONSTRAINT valid_email CHECK (((email)::text ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'::text))
);
    DROP TABLE public.users;
       public         heap r       postgres    false                       0    0    TABLE users    ACL     �   GRANT ALL ON TABLE public.users TO admin;
GRANT SELECT,INSERT,UPDATE ON TABLE public.users TO faculty_coordinator;
GRANT SELECT ON TABLE public.users TO marketing_manager;
          public               postgres    false    221            �            1259    24656    users_backup    TABLE     Q  CREATE TABLE public.users_backup (
    user_id integer,
    first_name character varying(50),
    last_name character varying(50),
    email character varying(100),
    password character varying(255),
    role_id integer,
    faculty_id integer,
    created_at timestamp without time zone,
    last_login timestamp without time zone
);
     DROP TABLE public.users_backup;
       public         heap r       postgres    false            �            1259    24711    users_backup_final    TABLE     W  CREATE TABLE public.users_backup_final (
    user_id integer,
    first_name character varying(50),
    last_name character varying(50),
    email character varying(100),
    password character varying(255),
    role_id integer,
    faculty_id integer,
    created_at timestamp without time zone,
    last_login timestamp without time zone
);
 &   DROP TABLE public.users_backup_final;
       public         heap r       postgres    false            �            1259    24766    users_backup_roles    TABLE     e  CREATE TABLE public.users_backup_roles (
    user_id integer,
    first_name character varying(50),
    last_name character varying(50),
    email character varying(100),
    password character varying(255),
    role_id integer,
    created_at timestamp without time zone,
    last_login timestamp without time zone,
    faculty_id character varying(10)
);
 &   DROP TABLE public.users_backup_roles;
       public         heap r       postgres    false            �            1259    16403    users_user_id_seq    SEQUENCE     �   CREATE SEQUENCE public.users_user_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;
 (   DROP SEQUENCE public.users_user_id_seq;
       public               postgres    false    221                       0    0    users_user_id_seq    SEQUENCE OWNED BY     G   ALTER SEQUENCE public.users_user_id_seq OWNED BY public.users.user_id;
          public               postgres    false    220                       0    0    SEQUENCE users_user_id_seq    ACL     �   GRANT ALL ON SEQUENCE public.users_user_id_seq TO admin;
GRANT USAGE ON SEQUENCE public.users_user_id_seq TO faculty_coordinator;
          public               postgres    false    220            �           2604    24592    academic_settings setting_id    DEFAULT     �   ALTER TABLE ONLY public.academic_settings ALTER COLUMN setting_id SET DEFAULT nextval('public.academic_settings_setting_id_seq'::regclass);
 K   ALTER TABLE public.academic_settings ALTER COLUMN setting_id DROP DEFAULT;
       public               postgres    false    236    237    237            �           2604    16507    academicsettings setting_id    DEFAULT     �   ALTER TABLE ONLY public.academicsettings ALTER COLUMN setting_id SET DEFAULT nextval('public.academicsettings_setting_id_seq'::regclass);
 J   ALTER TABLE public.academicsettings ALTER COLUMN setting_id DROP DEFAULT;
       public               postgres    false    229    228    229            �           2604    16492    activitylogs log_id    DEFAULT     z   ALTER TABLE ONLY public.activitylogs ALTER COLUMN log_id SET DEFAULT nextval('public.activitylogs_log_id_seq'::regclass);
 B   ALTER TABLE public.activitylogs ALTER COLUMN log_id DROP DEFAULT;
       public               postgres    false    227    226    227            �           2604    24599    admissions admission_id    DEFAULT     �   ALTER TABLE ONLY public.admissions ALTER COLUMN admission_id SET DEFAULT nextval('public.admissions_admission_id_seq'::regclass);
 F   ALTER TABLE public.admissions ALTER COLUMN admission_id DROP DEFAULT;
       public               postgres    false    238    239    239            �           2604    16470    comments comment_id    DEFAULT     z   ALTER TABLE ONLY public.comments ALTER COLUMN comment_id SET DEFAULT nextval('public.comments_comment_id_seq'::regclass);
 B   ALTER TABLE public.comments ALTER COLUMN comment_id DROP DEFAULT;
       public               postgres    false    224    225    225            �           2604    24635    faculties faculty_id    DEFAULT     |   ALTER TABLE ONLY public.faculties ALTER COLUMN faculty_id SET DEFAULT nextval('public.faculties_faculty_id_seq'::regclass);
 C   ALTER TABLE public.faculties ALTER COLUMN faculty_id DROP DEFAULT;
       public               postgres    false    218    217    218            �           2604    24580    logs log_id    DEFAULT     j   ALTER TABLE ONLY public.logs ALTER COLUMN log_id SET DEFAULT nextval('public.logs_log_id_seq'::regclass);
 :   ALTER TABLE public.logs ALTER COLUMN log_id DROP DEFAULT;
       public               postgres    false    235    234    235            �           2604    24613    page_visits visit_id    DEFAULT     |   ALTER TABLE ONLY public.page_visits ALTER COLUMN visit_id SET DEFAULT nextval('public.page_visits_visit_id_seq'::regclass);
 C   ALTER TABLE public.page_visits ALTER COLUMN visit_id DROP DEFAULT;
       public               postgres    false    241    240    241            �           2604    16521    pagestatistics stat_id    DEFAULT     �   ALTER TABLE ONLY public.pagestatistics ALTER COLUMN stat_id SET DEFAULT nextval('public.pagestatistics_stat_id_seq'::regclass);
 E   ALTER TABLE public.pagestatistics ALTER COLUMN stat_id DROP DEFAULT;
       public               postgres    false    231    230    231            �           2604    16443    submissions submission_id    DEFAULT     �   ALTER TABLE ONLY public.submissions ALTER COLUMN submission_id SET DEFAULT nextval('public.submissions_submission_id_seq'::regclass);
 H   ALTER TABLE public.submissions ALTER COLUMN submission_id DROP DEFAULT;
       public               postgres    false    222    223    223            �           2604    16532    userbrowserstats stat_id    DEFAULT     �   ALTER TABLE ONLY public.userbrowserstats ALTER COLUMN stat_id SET DEFAULT nextval('public.userbrowserstats_stat_id_seq'::regclass);
 G   ALTER TABLE public.userbrowserstats ALTER COLUMN stat_id DROP DEFAULT;
       public               postgres    false    232    233    233            �           2604    16407    users user_id    DEFAULT     n   ALTER TABLE ONLY public.users ALTER COLUMN user_id SET DEFAULT nextval('public.users_user_id_seq'::regclass);
 <   ALTER TABLE public.users ALTER COLUMN user_id DROP DEFAULT;
       public               postgres    false    220    221    221            �          0    24589    academic_settings 
   TABLE DATA           p   COPY public.academic_settings (setting_id, academic_year, submission_deadline, final_edit_deadline) FROM stdin;
    public               postgres    false    237   )�       �          0    16504    academicsettings 
   TABLE DATA           �   COPY public.academicsettings (setting_id, academic_year, submission_deadline, final_edit_deadline, created_by, created_at, updated_at) FROM stdin;
    public               postgres    false    229   ]�       �          0    16489    activitylogs 
   TABLE DATA           |   COPY public.activitylogs (log_id, user_id, action_type, page_accessed, browser_info, ip_address, log_timestamp) FROM stdin;
    public               postgres    false    227   ��       �          0    24596 
   admissions 
   TABLE DATA           ]   COPY public.admissions (admission_id, user_id, admission_status, admission_date) FROM stdin;
    public               postgres    false    239   \�       �          0    16467    comments 
   TABLE DATA           k   COPY public.comments (comment_id, submission_id, user_id, comment_text, commented_at, is_read) FROM stdin;
    public               postgres    false    225   y�       �          0    16386 	   faculties 
   TABLE DATA           J   COPY public.faculties (faculty_id, faculty_name, description) FROM stdin;
    public               postgres    false    218   �       �          0    24659    faculties_backup 
   TABLE DATA           Q   COPY public.faculties_backup (faculty_id, faculty_name, description) FROM stdin;
    public               postgres    false    243   ��       �          0    24664    faculty_id_mapping 
   TABLE DATA           <   COPY public.faculty_id_mapping (old_id, new_id) FROM stdin;
    public               postgres    false    244   ��       �          0    24577    logs 
   TABLE DATA           K   COPY public.logs (log_id, user_id, action_type, log_timestamp) FROM stdin;
    public               postgres    false    235    �       �          0    24610    page_visits 
   TABLE DATA           y   COPY public.page_visits (visit_id, user_id, page_url, visit_timestamp, browser_info, ip_address, time_spent) FROM stdin;
    public               postgres    false    241   z�       �          0    16518    pagestatistics 
   TABLE DATA           U   COPY public.pagestatistics (stat_id, page_name, view_count, last_viewed) FROM stdin;
    public               postgres    false    231   ��       �          0    16395    roles 
   TABLE DATA           @   COPY public.roles (role_name, description, role_id) FROM stdin;
    public               postgres    false    219   �       �          0    24761    roles_backup 
   TABLE DATA           G   COPY public.roles_backup (role_id, role_name, description) FROM stdin;
    public               postgres    false    246   �       �          0    16440    submissions 
   TABLE DATA           �   COPY public.submissions (submission_id, user_id, faculty_id, title, description, file_path, file_type, submitted_at, last_updated, status, terms_accepted, academic_year, selected) FROM stdin;
    public               postgres    false    223   ��       �          0    16529    userbrowserstats 
   TABLE DATA           l   COPY public.userbrowserstats (stat_id, browser_name, browser_version, user_count, last_updated) FROM stdin;
    public               postgres    false    233   Q�       �          0    16404    users 
   TABLE DATA           }   COPY public.users (user_id, first_name, last_name, email, password, created_at, last_login, faculty_id, role_id) FROM stdin;
    public               postgres    false    221   ��       �          0    24656    users_backup 
   TABLE DATA           �   COPY public.users_backup (user_id, first_name, last_name, email, password, role_id, faculty_id, created_at, last_login) FROM stdin;
    public               postgres    false    242   ��       �          0    24711    users_backup_final 
   TABLE DATA           �   COPY public.users_backup_final (user_id, first_name, last_name, email, password, role_id, faculty_id, created_at, last_login) FROM stdin;
    public               postgres    false    245   ��       �          0    24766    users_backup_roles 
   TABLE DATA           �   COPY public.users_backup_roles (user_id, first_name, last_name, email, password, role_id, created_at, last_login, faculty_id) FROM stdin;
    public               postgres    false    247   ��                  0    0     academic_settings_setting_id_seq    SEQUENCE SET     O   SELECT pg_catalog.setval('public.academic_settings_setting_id_seq', 1, false);
          public               postgres    false    236                       0    0    academicsettings_setting_id_seq    SEQUENCE SET     M   SELECT pg_catalog.setval('public.academicsettings_setting_id_seq', 1, true);
          public               postgres    false    228            	           0    0    activitylogs_log_id_seq    SEQUENCE SET     F   SELECT pg_catalog.setval('public.activitylogs_log_id_seq', 19, true);
          public               postgres    false    226            
           0    0    admissions_admission_id_seq    SEQUENCE SET     J   SELECT pg_catalog.setval('public.admissions_admission_id_seq', 1, false);
          public               postgres    false    238                       0    0    comments_comment_id_seq    SEQUENCE SET     E   SELECT pg_catalog.setval('public.comments_comment_id_seq', 3, true);
          public               postgres    false    224                       0    0    faculties_faculty_id_seq    SEQUENCE SET     F   SELECT pg_catalog.setval('public.faculties_faculty_id_seq', 9, true);
          public               postgres    false    217                       0    0    logs_log_id_seq    SEQUENCE SET     =   SELECT pg_catalog.setval('public.logs_log_id_seq', 2, true);
          public               postgres    false    234                       0    0    page_visits_visit_id_seq    SEQUENCE SET     G   SELECT pg_catalog.setval('public.page_visits_visit_id_seq', 1, false);
          public               postgres    false    240                       0    0    pagestatistics_stat_id_seq    SEQUENCE SET     H   SELECT pg_catalog.setval('public.pagestatistics_stat_id_seq', 6, true);
          public               postgres    false    230                       0    0    submissions_submission_id_seq    SEQUENCE SET     L   SELECT pg_catalog.setval('public.submissions_submission_id_seq', 13, true);
          public               postgres    false    222                       0    0    userbrowserstats_stat_id_seq    SEQUENCE SET     J   SELECT pg_catalog.setval('public.userbrowserstats_stat_id_seq', 5, true);
          public               postgres    false    232                       0    0    users_user_id_seq    SEQUENCE SET     @   SELECT pg_catalog.setval('public.users_user_id_seq', 12, true);
          public               postgres    false    220            !           2606    24594 (   academic_settings academic_settings_pkey 
   CONSTRAINT     n   ALTER TABLE ONLY public.academic_settings
    ADD CONSTRAINT academic_settings_pkey PRIMARY KEY (setting_id);
 R   ALTER TABLE ONLY public.academic_settings DROP CONSTRAINT academic_settings_pkey;
       public                 postgres    false    237                       2606    16511 &   academicsettings academicsettings_pkey 
   CONSTRAINT     l   ALTER TABLE ONLY public.academicsettings
    ADD CONSTRAINT academicsettings_pkey PRIMARY KEY (setting_id);
 P   ALTER TABLE ONLY public.academicsettings DROP CONSTRAINT academicsettings_pkey;
       public                 postgres    false    229                       2606    16495    activitylogs activitylogs_pkey 
   CONSTRAINT     `   ALTER TABLE ONLY public.activitylogs
    ADD CONSTRAINT activitylogs_pkey PRIMARY KEY (log_id);
 H   ALTER TABLE ONLY public.activitylogs DROP CONSTRAINT activitylogs_pkey;
       public                 postgres    false    227            #           2606    24603    admissions admissions_pkey 
   CONSTRAINT     b   ALTER TABLE ONLY public.admissions
    ADD CONSTRAINT admissions_pkey PRIMARY KEY (admission_id);
 D   ALTER TABLE ONLY public.admissions DROP CONSTRAINT admissions_pkey;
       public                 postgres    false    239                       2606    16476    comments comments_pkey 
   CONSTRAINT     \   ALTER TABLE ONLY public.comments
    ADD CONSTRAINT comments_pkey PRIMARY KEY (comment_id);
 @   ALTER TABLE ONLY public.comments DROP CONSTRAINT comments_pkey;
       public                 postgres    false    225                        2606    24642    faculties faculties_pkey 
   CONSTRAINT     ^   ALTER TABLE ONLY public.faculties
    ADD CONSTRAINT faculties_pkey PRIMARY KEY (faculty_id);
 B   ALTER TABLE ONLY public.faculties DROP CONSTRAINT faculties_pkey;
       public                 postgres    false    218                       2606    24582    logs logs_pkey 
   CONSTRAINT     P   ALTER TABLE ONLY public.logs
    ADD CONSTRAINT logs_pkey PRIMARY KEY (log_id);
 8   ALTER TABLE ONLY public.logs DROP CONSTRAINT logs_pkey;
       public                 postgres    false    235            %           2606    24618    page_visits page_visits_pkey 
   CONSTRAINT     `   ALTER TABLE ONLY public.page_visits
    ADD CONSTRAINT page_visits_pkey PRIMARY KEY (visit_id);
 F   ALTER TABLE ONLY public.page_visits DROP CONSTRAINT page_visits_pkey;
       public                 postgres    false    241                       2606    16527 +   pagestatistics pagestatistics_page_name_key 
   CONSTRAINT     k   ALTER TABLE ONLY public.pagestatistics
    ADD CONSTRAINT pagestatistics_page_name_key UNIQUE (page_name);
 U   ALTER TABLE ONLY public.pagestatistics DROP CONSTRAINT pagestatistics_page_name_key;
       public                 postgres    false    231                       2606    16525 "   pagestatistics pagestatistics_pkey 
   CONSTRAINT     e   ALTER TABLE ONLY public.pagestatistics
    ADD CONSTRAINT pagestatistics_pkey PRIMARY KEY (stat_id);
 L   ALTER TABLE ONLY public.pagestatistics DROP CONSTRAINT pagestatistics_pkey;
       public                 postgres    false    231                       2606    24773    roles roles_pkey 
   CONSTRAINT     S   ALTER TABLE ONLY public.roles
    ADD CONSTRAINT roles_pkey PRIMARY KEY (role_id);
 :   ALTER TABLE ONLY public.roles DROP CONSTRAINT roles_pkey;
       public                 postgres    false    219                       2606    16452    submissions submissions_pkey 
   CONSTRAINT     e   ALTER TABLE ONLY public.submissions
    ADD CONSTRAINT submissions_pkey PRIMARY KEY (submission_id);
 F   ALTER TABLE ONLY public.submissions DROP CONSTRAINT submissions_pkey;
       public                 postgres    false    223                       2606    16538 B   userbrowserstats userbrowserstats_browser_name_browser_version_key 
   CONSTRAINT     �   ALTER TABLE ONLY public.userbrowserstats
    ADD CONSTRAINT userbrowserstats_browser_name_browser_version_key UNIQUE (browser_name, browser_version);
 l   ALTER TABLE ONLY public.userbrowserstats DROP CONSTRAINT userbrowserstats_browser_name_browser_version_key;
       public                 postgres    false    233    233                       2606    16536 &   userbrowserstats userbrowserstats_pkey 
   CONSTRAINT     i   ALTER TABLE ONLY public.userbrowserstats
    ADD CONSTRAINT userbrowserstats_pkey PRIMARY KEY (stat_id);
 P   ALTER TABLE ONLY public.userbrowserstats DROP CONSTRAINT userbrowserstats_pkey;
       public                 postgres    false    233                       2606    16413    users users_email_key 
   CONSTRAINT     Q   ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key UNIQUE (email);
 ?   ALTER TABLE ONLY public.users DROP CONSTRAINT users_email_key;
       public                 postgres    false    221                       2606    16411    users users_pkey 
   CONSTRAINT     S   ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (user_id);
 :   ALTER TABLE ONLY public.users DROP CONSTRAINT users_pkey;
       public                 postgres    false    221                       1259    16487    idx_comments_submission    INDEX     U   CREATE INDEX idx_comments_submission ON public.comments USING btree (submission_id);
 +   DROP INDEX public.idx_comments_submission;
       public                 postgres    false    225                       1259    16502    idx_logs_timestamp    INDEX     T   CREATE INDEX idx_logs_timestamp ON public.activitylogs USING btree (log_timestamp);
 &   DROP INDEX public.idx_logs_timestamp;
       public                 postgres    false    227                       1259    16501    idx_logs_user    INDEX     I   CREATE INDEX idx_logs_user ON public.activitylogs USING btree (user_id);
 !   DROP INDEX public.idx_logs_user;
       public                 postgres    false    227                       1259    32781    idx_submissions_faculty    INDEX     U   CREATE INDEX idx_submissions_faculty ON public.submissions USING btree (faculty_id);
 +   DROP INDEX public.idx_submissions_faculty;
       public                 postgres    false    223            	           1259    16465    idx_submissions_status    INDEX     P   CREATE INDEX idx_submissions_status ON public.submissions USING btree (status);
 *   DROP INDEX public.idx_submissions_status;
       public                 postgres    false    223            
           1259    16463    idx_submissions_user    INDEX     O   CREATE INDEX idx_submissions_user ON public.submissions USING btree (user_id);
 (   DROP INDEX public.idx_submissions_user;
       public                 postgres    false    223                       1259    16424    idx_users_email    INDEX     B   CREATE INDEX idx_users_email ON public.users USING btree (email);
 #   DROP INDEX public.idx_users_email;
       public                 postgres    false    221            0           2620    16540 '   submissions update_submission_timestamp    TRIGGER     �   CREATE TRIGGER update_submission_timestamp BEFORE UPDATE ON public.submissions FOR EACH ROW EXECUTE FUNCTION public.update_last_modified();
 @   DROP TRIGGER update_submission_timestamp ON public.submissions;
       public               postgres    false    248    223            ,           2606    16512 1   academicsettings academicsettings_created_by_fkey    FK CONSTRAINT     �   ALTER TABLE ONLY public.academicsettings
    ADD CONSTRAINT academicsettings_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(user_id);
 [   ALTER TABLE ONLY public.academicsettings DROP CONSTRAINT academicsettings_created_by_fkey;
       public               postgres    false    221    229    4871            +           2606    16496 &   activitylogs activitylogs_user_id_fkey    FK CONSTRAINT     �   ALTER TABLE ONLY public.activitylogs
    ADD CONSTRAINT activitylogs_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(user_id);
 P   ALTER TABLE ONLY public.activitylogs DROP CONSTRAINT activitylogs_user_id_fkey;
       public               postgres    false    221    227    4871            )           2606    16477 $   comments comments_submission_id_fkey    FK CONSTRAINT     �   ALTER TABLE ONLY public.comments
    ADD CONSTRAINT comments_submission_id_fkey FOREIGN KEY (submission_id) REFERENCES public.submissions(submission_id) ON DELETE CASCADE;
 N   ALTER TABLE ONLY public.comments DROP CONSTRAINT comments_submission_id_fkey;
       public               postgres    false    225    223    4876            *           2606    16482    comments comments_user_id_fkey    FK CONSTRAINT     �   ALTER TABLE ONLY public.comments
    ADD CONSTRAINT comments_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(user_id);
 H   ALTER TABLE ONLY public.comments DROP CONSTRAINT comments_user_id_fkey;
       public               postgres    false    221    4871    225            .           2606    24604    admissions fk_admission_user    FK CONSTRAINT     �   ALTER TABLE ONLY public.admissions
    ADD CONSTRAINT fk_admission_user FOREIGN KEY (user_id) REFERENCES public.users(user_id);
 F   ALTER TABLE ONLY public.admissions DROP CONSTRAINT fk_admission_user;
       public               postgres    false    221    4871    239            &           2606    24719    users fk_faculty    FK CONSTRAINT     ~   ALTER TABLE ONLY public.users
    ADD CONSTRAINT fk_faculty FOREIGN KEY (faculty_id) REFERENCES public.faculties(faculty_id);
 :   ALTER TABLE ONLY public.users DROP CONSTRAINT fk_faculty;
       public               postgres    false    221    4864    218            -           2606    24583    logs fk_log_user    FK CONSTRAINT     t   ALTER TABLE ONLY public.logs
    ADD CONSTRAINT fk_log_user FOREIGN KEY (user_id) REFERENCES public.users(user_id);
 :   ALTER TABLE ONLY public.logs DROP CONSTRAINT fk_log_user;
       public               postgres    false    4871    235    221            '           2606    32783    users fk_role    FK CONSTRAINT     q   ALTER TABLE ONLY public.users
    ADD CONSTRAINT fk_role FOREIGN KEY (role_id) REFERENCES public.roles(role_id);
 7   ALTER TABLE ONLY public.users DROP CONSTRAINT fk_role;
       public               postgres    false    4866    219    221            /           2606    24619    page_visits fk_visit_user    FK CONSTRAINT     �   ALTER TABLE ONLY public.page_visits
    ADD CONSTRAINT fk_visit_user FOREIGN KEY (user_id) REFERENCES public.users(user_id) ON DELETE SET NULL;
 C   ALTER TABLE ONLY public.page_visits DROP CONSTRAINT fk_visit_user;
       public               postgres    false    221    4871    241            (           2606    16453 $   submissions submissions_user_id_fkey    FK CONSTRAINT     �   ALTER TABLE ONLY public.submissions
    ADD CONSTRAINT submissions_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(user_id);
 N   ALTER TABLE ONLY public.submissions DROP CONSTRAINT submissions_user_id_fkey;
       public               postgres    false    4871    223    221            �           3256    32782 &   submissions faculty_coordinator_policy    POLICY     �   CREATE POLICY faculty_coordinator_policy ON public.submissions USING (((faculty_id)::text = (public.current_user_faculty_id())::text));
 >   DROP POLICY faculty_coordinator_policy ON public.submissions;
       public               postgres    false    223    223    253            �           3256    24724 %   submissions student_submission_policy    POLICY     l   CREATE POLICY student_submission_policy ON public.submissions USING ((user_id = public.current_user_id()));
 =   DROP POLICY student_submission_policy ON public.submissions;
       public               postgres    false    252    223    223            �           0    16440    submissions    ROW SECURITY     9   ALTER TABLE public.submissions ENABLE ROW LEVEL SECURITY;          public               postgres    false    223            �   $   x�3�4202�� �����.�i�kd����� ���      �   <   x�3�4202�� ���� �Ɯ1~P��������������������)�=... Xf�      �   �  x�Ֆ�j1@ף��2�F�O��r�h!�M �Bq�I"2����__M۽���Hh�]]a��0>�����n��w��W��L؋��݌?_���"8����en�^.�b�������)��^\�[޼�Cy������xi?<������8{�~\�˿%]���^�\a���$Kt��=j��CFr�n�QR�舄9i�Q)S�ĳ7�,#'���'o��p���v����	s��V��C6������/Ǉ2���5�C�^#�	g�2�KB&�x%$׊�HULj����� �K���+9/$ ���$�JH�4�d��E�>y�M��B����=D�M��>��\P��nR^�2֌����@�L��B��ӪzH��q�)�M��~�pr>Q���v�h&��N
:a���g��R/g�      �      x������ � �      �   �   x�U��
B1��W�v7�tV�66�M�h���+ܿ7b�p�j���	F�_�o�l�B�v4'Ȝ�'"팉1�C�7�-���I�'"��N� ��s/8��l8j���p�M���rF[ǁ�L�Z)�ڣ$v      �   �   x�m���0Eם��ʥ��X�	��7n�R�	Lmc�{�����s�N&9b�˜$�wtAy�$o�#�B��^i���U)�*8�ڍ�o}�,��(l]V%��8�!���0�_ۺ7X��{�����Y�\�;µl}C�2���	�,9�Lއ�k�w���O�F�*#��;�!?�WR�݂�=�i���஀� �$o�G      �   �   x�m���0Eם��ʥ��X�	��7n�R�	Lmc�{�����s�N&9b�˜$�wtAy�$o�#�B��^i���U)�*8�ڍ�o}�,��(l]V%��8�!���0�_ۺ7X��{�����Y�\�;µl}C�2���	�,9�Lއ�k�w���O�F�*#��;�!?�WR�݂�=�i���஀� �$o�G      �   N   x�3�t
	V���2�t
�2�t��v��2�tu	�2�t�s�2��pu�	� ��s�8�sYp�ؖ���� F� �G      �   J   x�3�4�.M��,.����4202�50�56P02�22�21�350564�2�4¥��� ��X�����ܔ+F��� �{+      �      x������ � �      �   h   x�����  �s��$?�x��`����n����	�z 4nD;Nˀ�[��U{��*)�kh�g�7�,µH�Z�j��Ge��Z�y�/'���O{h��|<6�      �   �   x�U�An� E�p��@{�(n�.K�����C����;n�n@�}���MT7��f�%�	n$#\��`�Ef������M�D�0@m�0�S�/LL2���;��!.�AF,`0��)������Wc�/�����߷G�}PH�����R���e��y"f*P훦�t'�a�ݐy�&��L��8����$���S��CF��K1������=��� �����g��o/��x�Z� �ׅ�      �   �   x�U�AN1E��)|��r �����ظ�;c�q��i5��d��bc�y�����[�X�nV�	��V�r��ǚ`����7� [���𙊲�0��B��r�D
6R���J^V��5����Kd�ʷ���p�PHOY�����E�7i=L�����Y�$�����Q@Y[���̡D��Կ��Jjk�_ϵM/�(��!K��ˠ�(��_���_��p      �   E  x����n�0E��W̪]I�[�vE6})��(���ʢ!Rq���q�8�H�Bsx�$�|�y;����ܺ�`>ޯ}�>����w�MlC��$�$��X,�p�
�����B�IUr��ʛP�%��S�2*3A����J�\Y�Ð�d����ڐ��\�\CҔ%�)���������/�up����'\�xŰv0ؾ	kH�o��q���K�C�5�K�Mࡵ�� ��0�op�.+����fW���a�"�z��+�*�s̕�Bdw��v9c���;��ݼ�C3��|����S�V\j-2c��ŋ���,+)sAJu)t�lsT�/�Փ(�ݮ�D�Q`����
z������)^d�R�R�鋥(dA�7͒L���xE�U"/YaX�
EW�W�Mk4�Y���OÈ�:I� #J`w�&�؆��Sv������"� -U*�iZ�F�+���%9�NB�@h(Y�B�����Վ�P�s���(B�'�z���!��m
C��{�Gr}<�a9Lm�:?���g��J���C��x^ 5�dEi��\^
���"��f� �b      �   g   x�3�t�(��M��I,I-.�4�4202�50�54W00�21�2��33�4���2�t�,JM˯ J�1gpbZbQ&Q�M8]S҉s�)�IFjg����b��c���� ��4�      �   �  x���Io�@��ï���ɬx9�����\�2����Y¯��i�DM��'ُ��L�!�Q ��S�g��#���y^Q&��vȢ�,��~�28�BTթ�bBA�E̓�H�	��Q�3�s
�Y��@6[-lY���d	�fz��;"�0���]�q�t1��a5���L��_H�$�"P���]e��
��S^{[��`_��FX�T�*$�R��"�6�t�u�������lǰ[K�"������E#�"^��خ�s���\�
��|q�%��0��4�2�����
�(�$��3����L�DS�ژ��_�2�a�\ކ����}�b:�n�,�W�.���t��.�8����h���ٱ�i���)�m���A�v�'��HitsD���)�i��]\�Q4?Z�8I���}ѫN��}��F�y�%��
Q,��Q{�g������o�M�\Ō�I�Y!�cb�)V����ѴEn=U}nG��4�������=���F.��F5��ؒ,e\|'��l�n�~xE#�B6�GbL:�C#H�M�
b�5�ߍԀ����l�W3e"�(��Tdb'?��Pۚ��ݯN�[�S_w�L�G�+���뇲�.�X���b���>b��,�Rx����L��F`���O�J�:���O\�p1_�n�85�9z��E�;��$Jc��꒟\3�-�h���*i7b�-�M11�@wi[_�;��f���V�u�h�      �   �   x�}��J�0�s�}��7M��7/	X�V��e�޶���d>�~rs������n>�T��J^�۹��8e$v����@ND�`@���I�Qk�ڈ��Æ<�2�܊�+�w���l�	s��
�ch�H��2>.�e_�yt�/e��H+r�_n�ݚT֦(�I����gw�_�����w0b�P��1�L�X*`J�)x�?)�i�      �   �   x�}��J�0�s�}��7M��7/	X�V��e�޶���d>�~rs������n>�T��J^�۹��8e$v����@ND�`@���I�Qk�ڈ��Æ<�2�܊�+�w���l�	s��
�ch�H��2>.�e_�yt�/e��H+r�_n�ݚT֦(�I����gw�_�����w0b�P��1�L�X*`J�)x�?)�i�      �   �   x���;o�0���+��ź/��Ԉ��T%ٺD�R�Th14ʿ/�!��]�+�|:C��a���ql�C��lB=��!�S���
�lW�+��#{$Cę�K�)�s��`�����KU>'�����/�D5�[����ΰ����)"/draVն�)����B݅��{����L|�JR��:�S]�6��س.D9���zx�o�u�Ѵ�����0��D���u�z3�����H�]�7�$���q;     