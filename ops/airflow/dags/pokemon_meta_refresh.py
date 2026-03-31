import json
import os
from datetime import datetime, timedelta
from urllib import request

from airflow import DAG
from airflow.operators.python import PythonOperator


OPS_TOKEN_HEADER = "x-ops-token"
DEFAULT_DAG_FAMILY = "pokemon_meta_refresh"
DEFAULT_API_BASE_URL = os.environ.get("POKEMON_PROJECT_API_BASE_URL", "http://host.docker.internal:3000")
DEFAULT_TARGET_NAME = os.environ.get("POKEMON_PROJECT_ENV_NAME", "local")
DEFAULT_DAG_SCHEDULE = os.environ.get("POKEMON_PROJECT_DAG_SCHEDULE", "0 */12 * * *")
DEFAULT_OPS_TOKEN = os.environ.get("POKEMON_PROJECT_OPS_TOKEN", "")


def normalize_identifier(value):
    return "".join(character if character.isalnum() else "_" for character in value.strip().lower()).strip("_")


def load_targets():
    raw_targets = os.environ.get("POKEMON_PROJECT_TARGETS_JSON")

    if not raw_targets:
        return [
            {
                "name": DEFAULT_TARGET_NAME,
                "api_base_url": DEFAULT_API_BASE_URL.rstrip("/"),
                "schedule": DEFAULT_DAG_SCHEDULE,
                "token": DEFAULT_OPS_TOKEN,
            }
        ]

    parsed_targets = json.loads(raw_targets)
    targets = []

    for index, target in enumerate(parsed_targets):
        name = normalize_identifier(target.get("name", f"target_{index + 1}"))

        if not name:
            raise ValueError("Cada target necesita un nombre valido en POKEMON_PROJECT_TARGETS_JSON")

        api_base_url = str(target["apiBaseUrl"]).rstrip("/")

        targets.append(
            {
                "name": name,
                "api_base_url": api_base_url,
                "schedule": target.get("schedule", DEFAULT_DAG_SCHEDULE),
                "token": target.get("token", ""),
            }
        )

    return targets


TARGETS = load_targets()


def request_json(url, method="GET", token="", payload=None, extra_headers=None):
    headers = {}

    if payload is not None:
        headers["Content-Type"] = "application/json"

    if token:
        headers[OPS_TOKEN_HEADER] = token

    if extra_headers:
        headers.update(extra_headers)

    req = request.Request(
        url,
        data=json.dumps(payload).encode("utf-8") if payload is not None else None,
        headers=headers,
        method=method,
    )

    with request.urlopen(req, timeout=60 * 60) as response:
        payload = json.loads(response.read().decode("utf-8"))

    return payload


def inspect_meta_sources(target):
    payload = request_json(
        f"{target['api_base_url']}/api/ops/meta-refresh/status",
        token=target["token"],
        extra_headers=target.get("headers", {}),
    )
    recommended_steps = payload["plan"]["recommendedSteps"]
    print(json.dumps(payload, indent=2))
    print(f"Recommended steps: {recommended_steps}")


def apply_meta_refresh(target):
    payload = request_json(
        f"{target['api_base_url']}/api/ops/meta-refresh/apply",
        method="POST",
        token=target["token"],
        payload={"force": False},
        extra_headers=target.get("headers", {}),
    )
    print(json.dumps(payload, indent=2))


default_args = {
    "owner": "pokemon-project",
    "depends_on_past": False,
    "retries": 2,
    "retry_delay": timedelta(minutes=15),
}


def build_dag(target):
    dag_id = DEFAULT_DAG_FAMILY if len(TARGETS) == 1 else f"{DEFAULT_DAG_FAMILY}__{target['name']}"

    with DAG(
        dag_id=dag_id,
        description=f"Refresco inteligente del meta competitivo para {target['name']}",
        start_date=datetime(2026, 3, 31),
        schedule=target["schedule"],
        catchup=False,
        default_args=default_args,
        max_active_runs=1,
        tags=["pokemon", "showdown", "smogon", "meta", target["name"]],
    ) as dag:
        inspect_meta_sources_task = PythonOperator(
            task_id="inspect_meta_sources",
            python_callable=inspect_meta_sources,
            op_kwargs={"target": target},
        )

        apply_meta_refresh_task = PythonOperator(
            task_id="apply_meta_refresh",
            python_callable=apply_meta_refresh,
            op_kwargs={"target": target},
        )

        inspect_meta_sources_task >> apply_meta_refresh_task

    return dag


for airflow_target in TARGETS:
    dag = build_dag(airflow_target)
    globals()[dag.dag_id] = dag
