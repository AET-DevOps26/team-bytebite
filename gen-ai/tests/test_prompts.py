from prompts import DIETARY_RULES, build_system_prompt

CATEGORY_TOKENS = [
    "Produce",
    "Dairy",
    "Meat",
    "Seafood",
    "Bakery",
    "Pantry",
    "Frozen",
    "Beverages",
    "Spices",
    "Other",
]


def test_no_restrictions_uses_default_section():
    prompt = build_system_prompt([])
    assert "No dietary restrictions specified" in prompt
    for rule in DIETARY_RULES.values():
        assert rule not in prompt


def test_known_restriction_included():
    prompt = build_system_prompt(["Vegan"])
    assert DIETARY_RULES["Vegan"] in prompt
    assert "For each flagged ingredient" in prompt


def test_multiple_restrictions_all_present():
    prompt = build_system_prompt(["Vegan", "Gluten Free"])
    assert DIETARY_RULES["Vegan"] in prompt
    assert DIETARY_RULES["Gluten Free"] in prompt
    assert "Vegan, Gluten Free" in prompt


def test_category_token_list_present():
    prompt = build_system_prompt([])
    for token in CATEGORY_TOKENS:
        assert token in prompt
