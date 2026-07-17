from apscheduler.schedulers.blocking import BlockingScheduler
from main import main
from logs.logger import logger
from emails.verificador_vencimentos import verificar_vencimentos

HORARIOS_EXECUCAO = [
    {"hour": 10, "minute": 31},
    {"hour": 11, "minute": 31},
    {"hour": 12, "minute": 31},
    {"hour": 13, "minute": 31},
    {"hour": 14, "minute": 31},
    {"hour": 15, "minute": 31},
    {"hour": 16, "minute": 31},
]


def executar_job():
    try:
        logger.info("Scheduler iniciou uma execução automática.")
        main()
        logger.info("Scheduler finalizou a execução automática.")
    except Exception as erro:
        logger.erro(f"Erro no scheduler: {erro}")

def executar_verificacao_vencimentos():
    try:
        logger.info(
            "Iniciando verificação automática de vencimentos."
        )

        verificar_vencimentos()

        logger.info(
            "Verificação automática de vencimentos concluída."
        )

    except Exception as erro:
        logger.erro(
            "Erro na verificação de vencimentos: "
            f"{erro}"
        )


def iniciar_scheduler():
    scheduler = BlockingScheduler(timezone="America/Sao_Paulo")

    for horario in HORARIOS_EXECUCAO:
        scheduler.add_job(
            executar_job,
            "cron",
            day_of_week="mon-fri",
            hour=horario["hour"],
            minute=horario["minute"],
            id=f"execucao_{horario['hour']}_{horario['minute']}",
            replace_existing=True,
        )
    scheduler.add_job(
        executar_verificacao_vencimentos,
        "cron",
        hour=8,
        minute=0,
        id="verificacao_vencimentos",
        replace_existing=True,
    )
    print()
    print("=" * 50)
    print("SCHEDULER PADRÕES B3 ATIVO")
    print("=" * 50)
    print("Execuções programadas:")

    for horario in HORARIOS_EXECUCAO:
        print(f"{horario['hour']:02d}:{horario['minute']:02d}")
    print()
    print("Verificação de vencimentos:")
    print("Todos os dias às 08:00")

    print()
    print("Pressione CTRL + C para parar.")

    logger.info("Scheduler iniciado.")

    scheduler.start()


if __name__ == "__main__":
    iniciar_scheduler()