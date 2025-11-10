graph TB
subgraph "User Interface Layer"
UI[("🖥️ SvelteKit UI<br/>(Foundation Health Theme)")]
HOME["🏠 Home Page<br/>(Hero + Features)"]
CALC["🧮 Calculator Page<br/>(Input + Results)"]
UI --> HOME
UI --> CALC
end

    subgraph "Presentation Logic"
        PRESETS["📋 Quick Presets<br/>(Sample Rx)"]
        INPUT["📝 User Input<br/>(Drug + SIG + Days)"]
        RESULTS["📊 Results Display<br/>(Recommendations)"]
        WARNINGS_UI["⚠️ Warnings Display<br/>(Alerts + Badges)"]
        JSON_VIEW["📄 JSON Viewer<br/>(Copy Button)"]

        CALC --> PRESETS
        CALC --> INPUT
        CALC --> RESULTS
        RESULTS --> WARNINGS_UI
        RESULTS --> JSON_VIEW
    end

    subgraph "Controller Layer"
        CTRL["🎯 Main Controller<br/>(processRecommendation)"]
        DEBOUNCE["⏱️ Debouncer<br/>(300ms)"]
        METRICS["📈 Performance Metrics<br/>(Timing + Cache Stats)"]

        INPUT --> DEBOUNCE
        DEBOUNCE --> CTRL
        CTRL --> METRICS
    end

    subgraph "Domain Logic Layer (Client-Side)"
        SIG_PARSER["🔍 SIG Parser<br/>(Unified Orchestration)"]
        SIG_RULES["📏 Rules Engine<br/>(Regex + Frequency Map)"]

        QUANTITY["🧪 Quantity Engine<br/>(computeTotalUnits)"]
        PACK_ENGINE["📦 Pack Selection<br/>(Multi-Pack Optimizer)"]

        EXACT["✅ Exact Match Finder"]
        MULTI["🔢 Multi-Pack Composer<br/>(Optimized: 20 NDCs)"]
        NEAREST["📍 Nearest Match Finder"]

        WARN_GEN["⚠️ Warning Generator<br/>(Inactive + Mismatch)"]

        CTRL --> SIG_PARSER
        SIG_PARSER --> SIG_RULES
        SIG_RULES -.->|Low Confidence| FUNCTIONS_SIG

        CTRL --> QUANTITY
        CTRL --> PACK_ENGINE

        PACK_ENGINE --> EXACT
        PACK_ENGINE --> MULTI
        PACK_ENGINE --> NEAREST

        CTRL --> WARN_GEN
    end

    subgraph "Firebase Cloud Functions (Server-Side)"
        FUNCTIONS_SIG["🔐 parseSigWithLLM<br/>(OpenAI GPT-4o-mini)"]
        FUNCTIONS_EXPLAIN["💬 explainRecommendation<br/>(Optional - Post-MVP)"]
        FUNCTIONS_SECRETS["🔑 Secrets Manager<br/>(OPENAI_API_KEY)"]

        FUNCTIONS_SIG --> FUNCTIONS_SECRETS
        FUNCTIONS_EXPLAIN --> FUNCTIONS_SECRETS
    end

    subgraph "Unit System"
        UNITS["🔧 Unit Normalizer<br/>(Canonical Units)"]
        ALIASES["📚 Unit Aliases<br/>(tab→EA, ml→mL)"]
        CONVERTER["🔄 Unit Converter<br/>(mg→g, etc)"]

        UNITS --> ALIASES
        UNITS --> CONVERTER

        SIG_PARSER --> UNITS
        QUANTITY --> UNITS
    end

    subgraph "Data Access Layer"
        RXNORM_ADAPTER["🏥 RxNorm Adapter<br/>(Drug Normalization)"]
        FDA_ADAPTER["💊 FDA NDC Adapter<br/>(Package Directory)"]
        CACHE["💾 localStorage Cache<br/>(24h TTL, Browser)"]

        CTRL --> RXNORM_ADAPTER
        CTRL --> FDA_ADAPTER

        RXNORM_ADAPTER --> CACHE
        FDA_ADAPTER --> CACHE
    end

    subgraph "Resilience Layer"
        RETRY["🔁 Retry Logic<br/>(2x Exponential)"]
        TIMEOUT["⏰ Timeouts<br/>(3-5s)"]
        CIRCUIT["🚦 Circuit Breaker<br/>(60s cooldown)"]

        RXNORM_ADAPTER --> RETRY
        FDA_ADAPTER --> RETRY
        RETRY --> TIMEOUT
        RETRY --> CIRCUIT
    end

    subgraph "External APIs"
        RXNORM_API["☁️ RxNorm API<br/>(NLM)"]
        FDA_API["☁️ FDA NDC Directory<br/>(OpenFDA)"]
        OPENAI_API["☁️ OpenAI API<br/>(GPT-4o-mini)"]

        RXNORM_ADAPTER --> RXNORM_API
        FDA_ADAPTER --> FDA_API
        FUNCTIONS_SIG --> OPENAI_API
        FUNCTIONS_EXPLAIN --> OPENAI_API
    end

    subgraph "Data Models"
        TYPES["📋 TypeScript Types"]

        DRUG_INPUT["DrugInput<br/>(query + SIG + days)"]
        NORM_SIG["NormalizedSig<br/>(dose + freq + unit)"]
        RXNORM_RESULT["RxNormResult<br/>(RxCUI + dose form)"]
        NDC_RECORD["NdcRecord<br/>(NDC11 + size + status)"]
        RECOMMENDATION["Recommendation<br/>(recommended + alternatives)"]
        RESULT_PAYLOAD["ResultPayload<br/>(complete output)"]

        TYPES --> DRUG_INPUT
        TYPES --> NORM_SIG
        TYPES --> RXNORM_RESULT
        TYPES --> NDC_RECORD
        TYPES --> RECOMMENDATION
        TYPES --> RESULT_PAYLOAD
    end

    subgraph "Deployment Infrastructure"
        FIREBASE_HOSTING["🔥 Firebase Hosting<br/>(Static SvelteKit)"]
        FIREBASE_FUNCTIONS["⚡ Cloud Functions<br/>(Node.js 18)"]
        ENV["🔐 Environment Config<br/>(.env.local)"]
        SECRETS["🔑 Firebase Secrets<br/>(OPENAI_API_KEY)"]

        UI --> FIREBASE_HOSTING
        FUNCTIONS_SIG --> FIREBASE_FUNCTIONS
        FUNCTIONS_EXPLAIN --> FIREBASE_FUNCTIONS
        CTRL --> ENV
        FIREBASE_FUNCTIONS --> SECRETS
    end

    subgraph "Testing & Quality"
        UNIT_TESTS["✅ Unit Tests<br/>(Vitest)"]
        INTEGRATION["🔗 Integration Tests<br/>(Mocked APIs)"]
        E2E["📋 Manual E2E<br/>(Checklist)"]
        FIXTURES["📦 Test Fixtures<br/>(40+ SIG samples)"]

        UNIT_TESTS --> SIG_RULES
        UNIT_TESTS --> QUANTITY
        UNIT_TESTS --> PACK_ENGINE
        INTEGRATION --> CTRL
        E2E --> CALC
        UNIT_TESTS --> FIXTURES
    end

    %% Styling
    classDef uiStyle fill:#C23D9C,stroke:#7D39AC,stroke-width:3px,color:#fff
    classDef controllerStyle fill:#2F56D2,stroke:#1E40AF,stroke-width:3px,color:#fff
    classDef engineStyle fill:#7D39AC,stroke:#6D28D9,stroke-width:2px,color:#fff
    classDef dataStyle fill:#10B981,stroke:#059669,stroke-width:2px,color:#fff
    classDef apiStyle fill:#F59E0B,stroke:#D97706,stroke-width:2px,color:#fff
    classDef infraStyle fill:#6366F1,stroke:#4F46E5,stroke-width:2px,color:#fff
    classDef testStyle fill:#EC4899,stroke:#DB2777,stroke-width:2px,color:#fff

    class UI,HOME,CALC,PRESETS,INPUT,RESULTS,WARNINGS_UI,JSON_VIEW uiStyle
    class CTRL,DEBOUNCE,METRICS controllerStyle
    class SIG_PARSER,SIG_RULES,QUANTITY,PACK_ENGINE,EXACT,MULTI,NEAREST,WARN_GEN,UNITS,ALIASES,CONVERTER engineStyle
    class FUNCTIONS_SIG,FUNCTIONS_EXPLAIN,FUNCTIONS_SECRETS,RXNORM_ADAPTER,FDA_ADAPTER,CACHE,RETRY,TIMEOUT,CIRCUIT dataStyle
    class RXNORM_API,FDA_API,OPENAI_API apiStyle
    class FIREBASE_HOSTING,FIREBASE_FUNCTIONS,ENV,SECRETS infraStyle
    class UNIT_TESTS,INTEGRATION,E2E,FIXTURES testStyle
