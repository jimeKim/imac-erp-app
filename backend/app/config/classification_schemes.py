"""
Classification Schemes Configuration
상품 분류 체계 설정

Phase 1: 단순형 스킴 (simple) - 사입/조립/생산
"""

from typing import Dict, List, TypedDict


class BehaviorFlags(TypedDict):
    """행동 플래그: 비즈니스 로직의 기준"""
    requires_bom: bool          # BOM 필수 여부
    requires_routing: bool      # 공정/라우팅 필수 여부
    is_production: bool         # 생산지시→완제품입고 흐름 사용
    is_assembly: bool           # 판매 시 하위부품 자동차감
    sale_allowed: bool          # 직접 판매 가능 여부


class ClassificationLabel(TypedDict):
    """분류 라벨"""
    code: str                   # 내부 코드 (안정, 변경 불가)
    name: Dict[str, str]        # 라벨명 (i18n: ko, en, zh)
    description: Dict[str, str] # 설명 (i18n)
    icon: str                   # 아이콘 (emoji)
    behavior: BehaviorFlags     # 행동 플래그


class ClassificationScheme(TypedDict):
    """분류 체계 스킴"""
    id: str                     # 스킴 ID
    name: Dict[str, str]        # 스킴 이름 (i18n)
    description: Dict[str, str] # 스킴 설명 (i18n)
    is_system_default: bool     # 시스템 기본 스킴 여부
    labels: List[ClassificationLabel]


# ============================================================================
# Phase 1: 단순형 스킴 (simple)
# ============================================================================

SCHEME_SIMPLE: ClassificationScheme = {
    "id": "simple",
    "name": {
        "ko": "단순형 (사입/조립/생산)",
        "en": "Simple (Purchase/Assembly/Production)",
        "zh": "简单型 (采购/组装/生产)"
    },
    "description": {
        "ko": "기본 3가지 분류로 대부분의 제조/유통 업무 커버",
        "en": "3 basic classifications covering most manufacturing/distribution needs",
        "zh": "3种基本分类，涵盖大多数制造/分销需求"
    },
    "is_system_default": True,
    "labels": [
        {
            "code": "PURCHASE",
            "name": {
                "ko": "사입",
                "en": "Purchase",
                "zh": "采购"
            },
            "description": {
                "ko": "외부에서 구매한 상품 (BOM/공정 불필요)",
                "en": "Items purchased from external suppliers (no BOM/routing)",
                "zh": "从外部采购的商品（无需BOM/工艺）"
            },
            "icon": "📦",
            "behavior": {
                "requires_bom": False,
                "requires_routing": False,
                "is_production": False,
                "is_assembly": False,
                "sale_allowed": True
            }
        },
        {
            "code": "ASSEMBLY",
            "name": {
                "ko": "조립",
                "en": "Assembly",
                "zh": "组装"
            },
            "description": {
                "ko": "부품을 조립하여 만드는 상품 (BOM 필요, 공정 간단)",
                "en": "Items assembled from components (BOM required, simple routing)",
                "zh": "由零部件组装的商品（需要BOM，简单工艺）"
            },
            "icon": "🔧",
            "behavior": {
                "requires_bom": True,
                "requires_routing": False,
                "is_production": False,
                "is_assembly": True,
                "sale_allowed": True
            }
        },
        {
            "code": "PRODUCTION",
            "name": {
                "ko": "생산",
                "en": "Production",
                "zh": "生产"
            },
            "description": {
                "ko": "생산 공정을 거쳐 만드는 상품 (BOM + 공정 필요)",
                "en": "Items manufactured through production processes (BOM + routing required)",
                "zh": "通过生产工艺制造的商品（需要BOM和工艺）"
            },
            "icon": "🏭",
            "behavior": {
                "requires_bom": True,
                "requires_routing": True,
                "is_production": True,
                "is_assembly": False,
                "sale_allowed": True
            }
        }
    ]
}


# ============================================================================
# Phase 2 준비: 확장형 스킴 (extended) - 사입/부품/모듈/조립/생산/번들
# ============================================================================

SCHEME_EXTENDED: ClassificationScheme = {
    "id": "extended",
    "name": {
        "ko": "확장형 (사입/부품/모듈/조립/생산/번들)",
        "en": "Extended (Purchase/Part/Module/Assembly/Production/Bundle)",
        "zh": "扩展型 (采购/零件/模块/组装/生产/套装)"
    },
    "description": {
        "ko": "세분화된 6가지 분류로 복잡한 제조 업무 지원",
        "en": "6 detailed classifications for complex manufacturing workflows",
        "zh": "6种详细分类，支持复杂的制造业务流程"
    },
    "is_system_default": False,
    "labels": [
        {
            "code": "PURCHASE",
            "name": {"ko": "사입", "en": "Purchase", "zh": "采购"},
            "description": {"ko": "외부 구매 상품", "en": "Purchased items", "zh": "外部采购商品"},
            "icon": "📦",
            "behavior": {
                "requires_bom": False,
                "requires_routing": False,
                "is_production": False,
                "is_assembly": False,
                "sale_allowed": True
            }
        },
        {
            "code": "PART",
            "name": {"ko": "부품", "en": "Part", "zh": "零件"},
            "description": {"ko": "조립/생산에 사용되는 부품", "en": "Parts for assembly/production", "zh": "用于组装/生产的零件"},
            "icon": "⚙️",
            "behavior": {
                "requires_bom": False,
                "requires_routing": False,
                "is_production": False,
                "is_assembly": False,
                "sale_allowed": False  # 직접 판매 불가 (옵션)
            }
        },
        {
            "code": "MODULE",
            "name": {"ko": "모듈", "en": "Module", "zh": "模块"},
            "description": {"ko": "부품으로 구성된 중간 단계 모듈", "en": "Intermediate modules from parts", "zh": "由零件组成的中间模块"},
            "icon": "🧩",
            "behavior": {
                "requires_bom": True,
                "requires_routing": False,
                "is_production": False,
                "is_assembly": True,
                "sale_allowed": False
            }
        },
        {
            "code": "ASSEMBLY",
            "name": {"ko": "조립", "en": "Assembly", "zh": "组装"},
            "description": {"ko": "모듈/부품을 조립한 상품", "en": "Assembled from modules/parts", "zh": "由模块/零件组装的商品"},
            "icon": "🔧",
            "behavior": {
                "requires_bom": True,
                "requires_routing": False,
                "is_production": False,
                "is_assembly": True,
                "sale_allowed": True
            }
        },
        {
            "code": "PRODUCTION",
            "name": {"ko": "생산", "en": "Production", "zh": "生产"},
            "description": {"ko": "공정을 거쳐 생산한 상품", "en": "Manufactured through processes", "zh": "通过工艺生产的商品"},
            "icon": "🏭",
            "behavior": {
                "requires_bom": True,
                "requires_routing": True,
                "is_production": True,
                "is_assembly": False,
                "sale_allowed": True
            }
        },
        {
            "code": "BUNDLE",
            "name": {"ko": "번들", "en": "Bundle", "zh": "套装"},
            "description": {"ko": "여러 상품을 묶은 세트", "en": "Bundle of multiple items", "zh": "多个商品的套装"},
            "icon": "📦🎁",
            "behavior": {
                "requires_bom": True,  # 번들 구성 정보 필요
                "requires_routing": False,
                "is_production": False,
                "is_assembly": False,  # 번들은 특수 출고 로직
                "sale_allowed": True
            }
        }
    ]
}


# ============================================================================
# 스킴 레지스트리
# ============================================================================

CLASSIFICATION_SCHEMES: Dict[str, ClassificationScheme] = {
    "simple": SCHEME_SIMPLE,
    "extended": SCHEME_EXTENDED
}


# ============================================================================
# Helper Functions
# ============================================================================

def get_scheme(scheme_id: str = "simple") -> ClassificationScheme:
    """스킴 조회"""
    return CLASSIFICATION_SCHEMES.get(scheme_id, SCHEME_SIMPLE)


def get_label(scheme_id: str, label_code: str) -> ClassificationLabel | None:
    """특정 라벨 조회"""
    scheme = get_scheme(scheme_id)
    for label in scheme["labels"]:
        if label["code"] == label_code:
            return label
    return None


def get_behavior_flags(scheme_id: str, label_code: str) -> BehaviorFlags | None:
    """행동 플래그 조회"""
    label = get_label(scheme_id, label_code)
    return label["behavior"] if label else None


def validate_label_code(scheme_id: str, label_code: str) -> bool:
    """라벨 코드 유효성 검사"""
    scheme = get_scheme(scheme_id)
    valid_codes = [label["code"] for label in scheme["labels"]]
    return label_code in valid_codes


def get_available_labels(scheme_id: str, locale: str = "ko") -> List[Dict[str, str]]:
    """사용 가능한 라벨 목록 (드롭다운용)"""
    scheme = get_scheme(scheme_id)
    return [
        {
            "code": label["code"],
            "name": label["name"].get(locale, label["name"]["ko"]),
            "icon": label["icon"],
            "description": label["description"].get(locale, label["description"]["ko"])
        }
        for label in scheme["labels"]
    ]


# ============================================================================
# 기존 item_type → 새 스킴 매핑 (마이그레이션용)
# ============================================================================

LEGACY_TYPE_MAPPING = {
    "FG": "PRODUCTION",      # 완제품 → 생산
    "SF": "PRODUCTION",      # 반제품 → 생산
    "MOD": "ASSEMBLY",       # 모듈 → 조립
    "PT": "ASSEMBLY",        # 부품 → 조립 (또는 PURCHASE)
    "RM": "PURCHASE",        # 원자재 → 사입
    "MR": "PURCHASE",        # 상품 → 사입
    "CS": "PURCHASE",        # 소모품 → 사입
    "PKG": "PURCHASE"        # 포장재 → 사입
}


def map_legacy_type(old_type: str) -> str:
    """기존 item_type을 새 스킴 코드로 매핑"""
    return LEGACY_TYPE_MAPPING.get(old_type, "PURCHASE")
